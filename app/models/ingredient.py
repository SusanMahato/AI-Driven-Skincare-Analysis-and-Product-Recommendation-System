from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.sql import func
from app.core.database import Base

class Ingredient(Base):
    __tablename__ = "ingredients"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True)
    benefit_description = Column(Text, nullable=True)
    condition_tags = Column(ARRAY(String), nullable=True)
    skin_type_tags = Column(ARRAY(String), nullable=True)
    conflict_with = Column(ARRAY(String), nullable=True)
    safe_time = Column(String(20), nullable=True)
    weather_tags = Column(ARRAY(String), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())