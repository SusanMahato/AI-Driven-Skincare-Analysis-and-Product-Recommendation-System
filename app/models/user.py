from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=True)
    is_verified = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    oauth_provider = Column(String, nullable=True)
    oauth_id = Column(String, nullable=True)
    profile_photo = Column(String, nullable=True)
    location_city = Column(String, nullable=True)
    location_latitude = Column(String, nullable=True)
    location_longitude = Column(String, nullable=True)
    theme = Column(String, default="light")
    email_notifications = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    skin_profile = relationship("SkinProfile", back_populates="user", uselist=False)
    scans = relationship("Scan", back_populates="user")
    verification_token = Column(String, nullable=True)
    reset_otp = Column(String, nullable=True)
    reset_otp_expires = Column(DateTime(timezone=True), nullable=True)