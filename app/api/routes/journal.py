from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import Optional
from datetime import date as date_type
import statistics

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.journal_entry import JournalEntry
from app.models.scan import Scan

router = APIRouter(prefix="/journal", tags=["Journal"])

# Minimum number of scan-to-scan gaps with journal data required
# before an insight is surfaced for a given factor/condition pair.
# Prevents misleading conclusions from tiny sample sizes.
MIN_GAPS_FOR_INSIGHT = 3

JOURNAL_FACTORS = ["sleep_hours", "water_intake_liters", "stress_level", "exercise_minutes"]

CONDITION_FIELDS = [
    "acne_score",
    "redness_score",
    "wrinkles_score",
    "dark_spots_score",
    "pores_score",
    "dark_circles_score",
]

FACTOR_LABELS = {
    "sleep_hours": "sleep",
    "water_intake_liters": "water intake",
    "stress_level": "stress",
    "exercise_minutes": "exercise",
}

CONDITION_LABELS = {
    "acne_score": "acne",
    "redness_score": "redness",
    "wrinkles_score": "wrinkles",
    "dark_spots_score": "dark spots",
    "pores_score": "pores",
    "dark_circles_score": "dark circles",
}


class JournalEntryInput(BaseModel):
    date: date_type
    sleep_hours: Optional[float] = Field(None, ge=0, le=24)
    water_intake_liters: Optional[float] = Field(None, ge=0)
    stress_level: Optional[int] = Field(None, ge=1, le=5)
    exercise_minutes: Optional[float] = Field(None, ge=0)
    notes: Optional[str] = None


@router.post("/entry")
def upsert_journal_entry(
    entry: JournalEntryInput,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    existing = db.query(JournalEntry).filter(
        JournalEntry.user_id == current_user.id,
        JournalEntry.date == entry.date
    ).first()

    if existing:
        existing.sleep_hours = entry.sleep_hours
        existing.water_intake_liters = entry.water_intake_liters
        existing.stress_level = entry.stress_level
        existing.exercise_minutes = entry.exercise_minutes
        existing.notes = entry.notes
        db.commit()
        db.refresh(existing)
        return existing

    new_entry = JournalEntry(
        user_id=current_user.id,
        date=entry.date,
        sleep_hours=entry.sleep_hours,
        water_intake_liters=entry.water_intake_liters,
        stress_level=entry.stress_level,
        exercise_minutes=entry.exercise_minutes,
        notes=entry.notes
    )
    db.add(new_entry)
    db.commit()
    db.refresh(new_entry)
    return new_entry


@router.get("/entries")
def get_journal_entries(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    entries = db.query(JournalEntry).filter(
        JournalEntry.user_id == current_user.id
    ).order_by(JournalEntry.date.desc()).all()
    return entries


@router.get("/insights")
def get_journal_insights(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    scans = db.query(Scan).filter(
        Scan.user_id == current_user.id
    ).order_by(Scan.created_at.asc()).all()

    entries = db.query(JournalEntry).filter(
        JournalEntry.user_id == current_user.id
    ).order_by(JournalEntry.date.asc()).all()

    if len(scans) < 2 or len(entries) == 0:
        return {
            "insights": [],
            "message": "Not enough scan or journal data yet to generate insights."
        }

    # Build scan-to-scan gaps: for each consecutive pair, average the
    # journal entries whose date falls within that window.
    gaps = []
    for i in range(len(scans) - 1):
        older_scan = scans[i]
        newer_scan = scans[i + 1]
        older_date = older_scan.created_at.date()
        newer_date = newer_scan.created_at.date()

        window_entries = [
            e for e in entries if older_date <= e.date < newer_date
        ]

        if not window_entries:
            continue

        gap_data = {"older_scan": older_scan, "newer_scan": newer_scan}
        for factor in JOURNAL_FACTORS:
            values = [getattr(e, factor) for e in window_entries if getattr(e, factor) is not None]
            gap_data[factor] = statistics.mean(values) if values else None
        gaps.append(gap_data)

    insights = []

    for factor in JOURNAL_FACTORS:
        qualifying_gaps = [g for g in gaps if g[factor] is not None]
        if len(qualifying_gaps) < MIN_GAPS_FOR_INSIGHT:
            continue

        factor_values = [g[factor] for g in qualifying_gaps]
        median_value = statistics.median(factor_values)

        above = [g for g in qualifying_gaps if g[factor] >= median_value]
        below = [g for g in qualifying_gaps if g[factor] < median_value]

        if not above or not below:
            continue

        for condition in CONDITION_FIELDS:
            above_deltas = []
            below_deltas = []

            for g in above:
                old_val = getattr(g["older_scan"], condition)
                new_val = getattr(g["newer_scan"], condition)
                if old_val is not None and new_val is not None:
                    above_deltas.append(new_val - old_val)

            for g in below:
                old_val = getattr(g["older_scan"], condition)
                new_val = getattr(g["newer_scan"], condition)
                if old_val is not None and new_val is not None:
                    below_deltas.append(new_val - old_val)

            if not above_deltas or not below_deltas:
                continue

            avg_above = statistics.mean(above_deltas)
            avg_below = statistics.mean(below_deltas)

            # Negative delta = improvement (severity dropped).
            # Only surface an insight if one bucket is clearly better than the other.
            diff = avg_above - avg_below
            if abs(diff) < 0.03:
                continue

            better_bucket = "below" if avg_below < avg_above else "above"
            factor_label = FACTOR_LABELS[factor]
            condition_label = CONDITION_LABELS[condition]

            if better_bucket == "below":
                message = f"Your {condition_label} tended to improve during periods with lower {factor_label}."
            else:
                message = f"Your {condition_label} tended to improve during periods with higher {factor_label}."

            insights.append({
                "condition": condition_label,
                "factor": factor_label,
                "message": message,
                "sample_size": len(qualifying_gaps),
                "avg_delta_above_median": round(avg_above, 4),
                "avg_delta_below_median": round(avg_below, 4)
            })

    return {
        "insights": insights,
        "total_scan_gaps_analyzed": len(gaps),
        "message": None if insights else "Not enough consistent patterns found yet to generate insights."
    }
    