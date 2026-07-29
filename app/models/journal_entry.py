from sqlalchemy import Column, Integer, Float, String, Date, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.core.database import Base

class JournalEntry(Base):
    __tablename__ = "journal_entries"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    date = Column(Date, nullable=False)

    sleep_hours = Column(Float, nullable=True)
    water_intake_liters = Column(Float, nullable=True)
    stress_level = Column(Integer, nullable=True)      # 1-5
    exercise_minutes = Column(Float, nullable=True)
    notes = Column(String, nullable=True)

    user = relationship("User", back_populates="journal_entries")

    __table_args__ = (
        UniqueConstraint("user_id", "date", name="uq_journal_user_date"),
    )
    