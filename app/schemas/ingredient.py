from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class IngredientBase(BaseModel):
    name: str
    benefit_description: Optional[str] = None
    condition_tags: Optional[List[str]] = None
    skin_type_tags: Optional[List[str]] = None
    conflict_with: Optional[List[str]] = None
    safe_time: Optional[str] = None
    weather_tags: Optional[List[str]] = None

class IngredientCreate(IngredientBase):
    pass

class IngredientResponse(IngredientBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True