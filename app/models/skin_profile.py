from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base

class SkinProfile(Base):
    __tablename__ = "skin_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    age_range = Column(String, nullable=True)
    gender = Column(String, nullable=True)
    skin_type = Column(String, nullable=True)
    products_used_before = Column(String, nullable=True)
    sensitivity = Column(String, nullable=True)
    sun_exposure = Column(String, nullable=True)
    concern_one = Column(String, nullable=True)
    concern_two = Column(String, nullable=True)
    skin_goal = Column(String, nullable=True)
    budget_tier = Column(String(20), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", back_populates="skin_profile")