from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import Optional
from datetime import date as date_type

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.journal_entry import JournalEntry
from app.services.journal_service import generate_insights

router = APIRouter(prefix="/journal", tags=["Journal"])


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
    return generate_insights(db, current_user.id)
