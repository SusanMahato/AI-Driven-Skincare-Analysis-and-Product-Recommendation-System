from sqlalchemy import Column, Integer, String, Text, Float, DateTime
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.sql import func
from app.core.database import Base

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    brand = Column(String(100), nullable=False)
    category = Column(String(50), nullable=False)
    key_ingredients = Column(ARRAY(String), nullable=True)
    condition_tags = Column(ARRAY(String), nullable=True)
    skin_type_tags = Column(ARRAY(String), nullable=True)
    weather_tags = Column(ARRAY(String), nullable=True)
    price_usd = Column(Float, nullable=True)
    price_npr = Column(Integer, nullable=True)
    price_tier = Column(String(20), nullable=False)
    buy_link_global = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())