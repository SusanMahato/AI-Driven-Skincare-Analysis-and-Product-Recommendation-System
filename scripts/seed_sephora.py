import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pandas as pd
import re
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.product import Product

def get_usd_to_npr_rate() -> float:
    try:
        import requests
        response = requests.get('https://api.exchangerate-api.com/v4/latest/USD', timeout=5)
        rate = response.json()['rates'].get('NPR', 151.78)
        print(f'Live USD to NPR rate: {rate}')
        return rate
    except:
        return 151.78

USD_TO_NPR = get_usd_to_npr_rate()

CATEGORY_MAP = {
    "moisturizer": "moisturizer",
    "moisturiser": "moisturizer",
    "cleanser": "cleanser",
    "face wash": "cleanser",
    "treatment": "treatment",
    "serum": "serum",
    "essence": "serum",
    "eye care": "eye_cream",
    "eye cream": "eye_cream",
    "sunscreen": "sunscreen",
    "spf": "sunscreen",
    "toner": "toner",
    "mask": "mask",
    "exfoliant": "exfoliant",
    "scrub": "exfoliant",
    "peel": "exfoliant",
    "lip balm": "other",
    "self tanner": "other",
    "wellness": "other",
    "tool": "other",
}

CONDITION_KEYWORD_MAP = {
    "acne": ["acne", "blemish", "breakout", "salicylic", "benzoyl", "tea tree", "neem", "zinc", "comedogen", "clog", "sebum", "blackhead", "whitehead"],
    "redness": ["redness", "soothing", "calming", "sensitive", "centella", "cica", "aloe", "rosacea", "irritat", "barrier", "anti-inflammatory", "oat", "bisabolol"],
    "texture": ["texture", "exfoliat", "smooth", "glycolic", "lactic", "retinol", "resurface", "renew", "uneven", "rough", "fine lines", "wrinkles"],
    "dark_spots": ["dark spot", "brightening", "pigment", "vitamin c", "niacinamide", "kojic", "arbutin", "tranexamic", "hyperpigmentat", "fade", "discolorat", "melasma"],
    "pores": ["pore", "minimiz", "tighten", "clay", "charcoal", "niacinamide", "sebum", "blackhead", "refine", "congest"],
    "dark_circles": ["dark circle", "eye", "caffeine", "peptide", "under eye", "undereye", "puffiness"],
}

WEATHER_KEYWORD_MAP = {
    "high_uv": ["spf", "sunscreen", "uv", "sun protection", "vitamin c", "antioxidant"],
    "humid": ["oil control", "mattif", "acne", "salicylic", "niacinamide", "clay", "lightweight", "gel", "water-based"],
    "dry_climate": ["hyaluronic", "moistur", "hydrat", "ceramide", "dry skin", "rich", "barrier", "nourish", "squalane", "shea"],
}

def normalize_category(raw: str) -> str:
    if not raw or str(raw) == "nan":
        return "other"
    raw_lower = str(raw).lower().strip()
    for key, val in CATEGORY_MAP.items():
        if key in raw_lower:
            return val
    return "other"

def get_price_tier(price_usd: float) -> str:
    if price_usd is None:
        return "mid"
    if price_usd < 10:
        return "budget"
    elif price_usd <= 30:
        return "mid"
    else:
        return "premium"

def get_condition_tags(text: str) -> list:
    if not text:
        return None
    text_lower = text.lower()
    tags = []
    for condition, keywords in CONDITION_KEYWORD_MAP.items():
        if any(kw in text_lower for kw in keywords):
            tags.append(condition)
    return tags if tags else None

def get_skin_type_tags(highlights: str) -> list:
    if not highlights or str(highlights) == "nan":
        return ["all"]
    text_lower = str(highlights).lower()
    tags = []
    if "oily" in text_lower:
        tags.append("oily")
    if "dry" in text_lower:
        tags.append("dry")
    if "combination" in text_lower:
        tags.append("combination")
    if "sensitive" in text_lower:
        tags.append("sensitive")
    if "normal" in text_lower:
        tags.append("normal")
    return tags if tags else ["all"]

def get_weather_tags(text: str) -> list:
    if not text:
        return None
    text_lower = text.lower()
    tags = []
    for tag, keywords in WEATHER_KEYWORD_MAP.items():
        if any(kw in text_lower for kw in keywords):
            tags.append(tag)
    return tags if tags else None

def parse_ingredients(ingredients_str: str) -> list:
    if not ingredients_str or str(ingredients_str) == "nan":
        return []
    return [i.strip() for i in str(ingredients_str).split(",") if i.strip()][:10]

def seed_sephora():
    df = pd.read_csv("scripts/data/product_info.csv")

    # Filter skincare only
    skincare = df[df["primary_category"] == "Skincare"].copy()
    print(f"Total Sephora skincare products: {len(skincare)}")

    db: Session = SessionLocal()
    seeded = 0
    skipped = 0
    brand_count = {}

    try:
        for _, row in skincare.iterrows():
            name = str(row.get("product_name", "")).strip()
            brand = str(row.get("brand_name", "")).strip()

            if not name or name == "nan" or not brand or brand == "nan":
                skipped += 1
                continue

            # Max 5 per brand
            brand_count[brand] = brand_count.get(brand, 0) + 1
            if brand_count[brand] > 5:
                skipped += 1
                continue

            # Skip if already exists
            existing = db.query(Product).filter(
                Product.name == name,
                Product.brand == brand
            ).first()
            if existing:
                skipped += 1
                continue

            price_usd = row.get("price_usd")
            try:
                price_usd = float(price_usd)
            except:
                price_usd = None

            category_raw = str(row.get("secondary_category", "")).strip()
            category = normalize_category(category_raw)

            # Skip non-skincare categories
            if category == "other":
                skipped += 1
                continue

            ingredients = parse_ingredients(row.get("ingredients", ""))
            highlights = str(row.get("highlights", ""))
            combined_text = f"{name} {category_raw} {highlights} {' '.join(ingredients)}"

            product = Product(
                name=name,
                brand=brand,
                category=category,
                key_ingredients=ingredients,
                condition_tags=get_condition_tags(combined_text),
                skin_type_tags=get_skin_type_tags(highlights),
                weather_tags=get_weather_tags(combined_text),
                price_usd=price_usd,
                price_npr=round(price_usd * USD_TO_NPR) if price_usd else None,
                price_tier=get_price_tier(price_usd),
                buy_link_global=None,
            )
            db.add(product)
            seeded += 1

        db.commit()
        print(f"Seeded: {seeded} Sephora products")
        print(f"Skipped: {skipped}")

    except Exception as e:
        db.rollback()
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_sephora()