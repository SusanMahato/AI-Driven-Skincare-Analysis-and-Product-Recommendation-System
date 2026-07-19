from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base

class Scan(Base):
    __tablename__ = "scans"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    photo_url = Column(String, nullable=True)
    scan_type = Column(String, default="full")

    # CV scores
    acne_score = Column(Float, nullable=True)
    redness_score = Column(Float, nullable=True)
    wrinkles_score = Column(Float, nullable=True)
    dark_spots_score = Column(Float, nullable=True)
    pores_score = Column(Float, nullable=True)
    dark_circles_score = Column(Float, nullable=True)
    photo_confidence = Column(Float, nullable=True)

    # Environmental data at time of scan
    uv_index = Column(Float, nullable=True)
    humidity = Column(Float, nullable=True)
    temperature = Column(Float, nullable=True)
    weather_condition = Column(String, nullable=True)

    # Recommendation
    recommended_spf = Column(Integer, nullable=True)
    skin_report = Column(String, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="scans")