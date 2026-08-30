import statistics
from datetime import date, timedelta
from sqlalchemy.orm import Session

from app.models.journal_entry import JournalEntry
from app.models.scan import Scan

# Minimum number of scan-to-scan gaps with journal data required
# before an insight is surfaced for a given factor/condition pair.
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

FACTOR_UNITS = {
    "sleep_hours": "h",
    "water_intake_liters": "L",
    "stress_level": "/5",
    "exercise_minutes": "min",
}


def generate_insights(db: Session, user_id: int) -> dict:
    """Correlates journal factors against scan-to-scan skin condition
    changes. Shared by the /journal/insights route and the recommendation
    engine's lifestyle-aware skin report."""
    scans = db.query(Scan).filter(
        Scan.user_id == user_id
    ).order_by(Scan.created_at.asc()).all()

    entries = db.query(JournalEntry).filter(
        JournalEntry.user_id == user_id
    ).order_by(JournalEntry.date.asc()).all()

    if len(scans) < 2 or len(entries) == 0:
        return {
            "insights": [],
            "message": "Not enough scan or journal data yet to generate insights."
        }

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


def get_journal_summary_for_report(db: Session, user_id: int) -> str | None:
    """Builds a short natural-language lifestyle summary (last 7 days'
    averages) plus the single strongest historical insight, if any, for
    inclusion in the AI-generated skin report prompt. Returns None if the
    user has no journal entries at all, so the report prompt is unaffected
    for users who don't use the journal."""
    recent_cutoff = date.today() - timedelta(days=7)
    recent_entries = db.query(JournalEntry).filter(
        JournalEntry.user_id == user_id,
        JournalEntry.date >= recent_cutoff
    ).all()

    if not recent_entries:
        return None

    lines = []
    for factor in JOURNAL_FACTORS:
        values = [getattr(e, factor) for e in recent_entries if getattr(e, factor) is not None]
        if values:
            avg = round(statistics.mean(values), 1)
            lines.append(f"{FACTOR_LABELS[factor]}: {avg}{FACTOR_UNITS[factor]} avg")

    if not lines:
        return None

    summary = "Last 7 days lifestyle — " + ", ".join(lines) + "."

    insights_result = generate_insights(db, user_id)
    top_insight = next(iter(insights_result.get("insights", [])), None)
    if top_insight:
        summary += f" Historical pattern: {top_insight['message']}"

    return summary
