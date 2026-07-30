from pydantic import BaseModel
from typing import Optional, Literal
from datetime import datetime

AgeRange = Literal["Under 18", "18-24", "25-34", "35-44", "45+"]
Gender = Literal["Male", "Female", "Prefer not to say"]
SkinType = Literal["Oily", "Dry", "Combination", "Normal", "I don't know"]
ProductsUsedBefore = Literal["Never", "Occasionally", "Regularly", "Used to but stopped"]
SunExposure = Literal["Under 1hr", "1-3hrs", "3hrs+"]
Concern = Literal[
    "Acne", "Oiliness", "Dryness", "Redness",
    "Dark spots", "Wrinkles", "Dark circles", "Pores"
]
SkinGoal = Literal["Clear skin", "Even tone", "Anti-aging", "Hydration", "Oil control"]


class QuizSubmit(BaseModel):
    age_range: AgeRange
    gender: Gender
    skin_type: SkinType
    products_used_before: ProductsUsedBefore
    # No question for this field currently exists in the quiz UI — frontend
    # always sends null. Left unconstrained since there's no real option set
    # to validate against yet.
    sensitivity: Optional[str] = None
    sun_exposure: SunExposure
    concern_one: Concern
    concern_two: Optional[Concern] = None
    skin_goal: SkinGoal


class SkinProfileResponse(BaseModel):
    id: int
    user_id: int
    age_range: Optional[str]
    gender: Optional[str]
    skin_type: Optional[str]
    products_used_before: Optional[str]
    sensitivity: Optional[str]
    sun_exposure: Optional[str]
    concern_one: Optional[str]
    concern_two: Optional[str]
    skin_goal: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True
        