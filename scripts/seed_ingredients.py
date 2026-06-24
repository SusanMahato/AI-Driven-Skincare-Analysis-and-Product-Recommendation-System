import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pandas as pd
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.ingredient import Ingredient

CONDITION_MAP = {
    "acne": [
        "salicylic acid", "benzoyl peroxide", "neem", "tea tree",
        "zinc", "sulfur", "niacinamide", "azelaic acid", "mandelic acid"
    ],
    "redness": [
        "centella asiatica", "aloe vera", "green tea", "colloidal oatmeal",
        "avena sativa", "allantoin", "azelaic acid", "chamomile", "bisabolol"
    ],
    "texture": [
        "glycolic acid", "lactic acid", "retinol", "bakuchiol",
        "mandelic acid"
    ],
    "dark_spots": [
        "vitamin c", "niacinamide", "kojic acid", "alpha arbutin",
        "tranexamic acid", "ascorbic acid", "mandelic acid"
    ],
    "pores": [
        "niacinamide", "salicylic acid", "retinol", "zinc", "clay"
    ],
    "dark_circles": [
        "caffeine", "retinol", "peptides", "hyaluronic acid"
    ]
}

CONFLICT_MAP = {
    "vitamin c": ["retinol", "glycolic acid", "lactic acid", "benzoyl peroxide"],
    "retinol": ["vitamin c", "glycolic acid", "lactic acid", "salicylic acid", "benzoyl peroxide", "mandelic acid"],
    "benzoyl peroxide": ["retinol", "vitamin c"],
    "glycolic acid": ["retinol", "salicylic acid"],
    "lactic acid": ["retinol", "salicylic acid"],
    "mandelic acid": ["retinol"],
    "salicylic acid": ["retinol", "glycolic acid", "lactic acid"],
    "kojic acid": ["glycolic acid", "lactic acid", "salicylic acid"],
    "alpha arbutin": ["glycolic acid", "lactic acid", "salicylic acid"],
}

SAFE_TIME_MAP = {
    "retinol": "night",
    "bakuchiol": "night",
    "glycolic acid": "night",
    "lactic acid": "night",
    "mandelic acid": "night",
    "benzoyl peroxide": "night",
    "kojic acid": "night",
    "vitamin c": "morning",
    "ascorbic acid": "morning",
    "caffeine": "morning",
    "salicylic acid": "both",
    "niacinamide": "both",
    "hyaluronic acid": "both",
    "centella asiatica": "both",
    "aloe vera": "both",
    "allantoin": "both",
    "azelaic acid": "both",
    "alpha arbutin": "both",
    "tranexamic acid": "both",
    "peptides": "both",
    "zinc": "both",
    "tea tree": "both",
    "neem": "both",
    "green tea": "both",
    "chamomile": "both",
    "bisabolol": "both",
    "clay": "both",
    "colloidal oatmeal": "both",
    "sulfur": "both",
}

WEATHER_MAP = {
    "vitamin c": ["high_uv"],
    "ascorbic acid": ["high_uv"],
    "zinc": ["high_uv"],
    "hyaluronic acid": ["dry_climate"],
    "colloidal oatmeal": ["dry_climate"],
    "aloe vera": ["dry_climate"],
    "centella asiatica": ["humid"],
    "niacinamide": ["humid"],
    "salicylic acid": ["humid"],
    "clay": ["humid"],
    "tea tree": ["humid"],
}

def get_condition_tags(name: str) -> list:
    name_lower = name.lower()
    tags = []
    for condition, ingredients in CONDITION_MAP.items():
        if any(ing in name_lower for ing in ingredients):
            tags.append(condition)
    return tags if tags else None

def get_conflict_with(name: str) -> list:
    name_lower = name.lower()
    for key, conflicts in CONFLICT_MAP.items():
        if key in name_lower:
            return conflicts
    return None

def get_safe_time(name: str) -> str:
    name_lower = name.lower()
    for key, time in SAFE_TIME_MAP.items():
        if key in name_lower:
            return time
    return "both"

def get_weather_tags(name: str) -> list:
    name_lower = name.lower()
    for key, tags in WEATHER_MAP.items():
        if key in name_lower:
            return tags
    return None

def get_skin_type_tags(who_good_for: str, who_avoid: str) -> list:
    tags = []
    text = str(who_good_for).lower() + " " + str(who_avoid).lower()
    if "oily" in text:
        tags.append("oily")
    if "dry" in text:
        tags.append("dry")
    if "combination" in text:
        tags.append("combination")
    if "sensitive" in text:
        tags.append("sensitive")
    if not tags:
        tags.append("all")
    return tags

def seed_ingredients():
    df = pd.read_csv("scripts/data/ingredientsList.csv")
    print(f"Total ingredients in dataset: {len(df)}")

    db: Session = SessionLocal()
    seeded = 0
    skipped = 0

    try:
        for _, row in df.iterrows():
            name = str(row.get("name", "")).strip()
            if not name or name == "nan":
                skipped += 1
                continue

            existing = db.query(Ingredient).filter(Ingredient.name == name).first()
            if existing:
                skipped += 1
                continue

            condition_tags = get_condition_tags(name)

            benefit = str(row.get("short_description", "")).strip()
            if benefit == "nan":
                benefit = str(row.get("what_does_it_do", "")).strip()
            if benefit == "nan":
                benefit = None

            ingredient = Ingredient(
                name=name,
                benefit_description=benefit,
                condition_tags=condition_tags,
                skin_type_tags=get_skin_type_tags(
                    row.get("who_is_it_good_for", ""),
                    row.get("who_should_avoid", "")
                ),
                conflict_with=get_conflict_with(name),
                safe_time=get_safe_time(name),
                weather_tags=get_weather_tags(name),
            )
            db.add(ingredient)
            seeded += 1

        db.commit()
        print(f"Seeded: {seeded} ingredients")
        print(f"Skipped: {skipped}")

    except Exception as e:
        db.rollback()
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_ingredients()