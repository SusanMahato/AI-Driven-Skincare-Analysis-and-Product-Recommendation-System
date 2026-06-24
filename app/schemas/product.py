from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class ProductBase(BaseModel):
    name: str
    brand: str
    category: str
    key_ingredients: Optional[List[str]] = None
    condition_tags: Optional[List[str]] = None
    skin_type_tags: Optional[List[str]] = None
    weather_tags: Optional[List[str]] = None
    price_usd: Optional[float] = None
    price_npr: Optional[int] = None
    price_tier: str
    buy_link_global: Optional[str] = None

class ProductCreate(ProductBase):
    pass

class ProductResponse(ProductBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class ProductCard(BaseModel):
    id: int
    name: str
    brand: str
    category: str
    price_usd: Optional[float] = None
    price_npr: Optional[int] = None
    price_tier: str
    key_ingredients: Optional[List[str]] = None
    matched_ingredients: Optional[List[str]] = None
    why_it_suits_you: Optional[str] = None
    safe_time: Optional[str] = None
    buy_link_global: Optional[str] = None
    conflict_warning: Optional[str] = None