import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pandas as pd
import json
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
    "night cream": "moisturizer",
    "day cream": "moisturizer",
    "lotion": "moisturizer",
    "balm": "moisturizer",
    "cleanser": "cleanser",
    "face wash": "cleanser",
    "foam": "cleanser",
    "foaming": "cleanser",
    "micellar": "cleanser",
    "makeup remover": "cleanser",
    "serum": "serum",
    "essence": "serum",
    "serum oil": "serum",
    "retinol": "treatment",
    "spot treatment": "treatment",
    "treatment": "treatment",
    "sunscreen": "sunscreen",
    "spf": "sunscreen",
    "sun screen": "sunscreen",
    "eye cream": "eye_cream",
    "eye serum": "eye_cream",
    "eye gel": "eye_cream",
    "toner": "toner",
    "mist": "toner",
    "exfoliant": "exfoliant",
    "scrub": "exfoliant",
    "peel": "exfoliant",
    "mask": "mask",
    "facial oil": "facial_oil",
}

CONDITION_KEYWORD_MAP = {
    "acne": [
        "acne", "blemish", "breakout", "salicylic", "benzoyl",
        "tea tree", "neem", "zinc", "comedogen", "clog",
        "sebum", "blackhead", "whitehead"
    ],
    "redness": [
        "redness", "soothing", "calming", "sensitive", "centella",
        "cica", "aloe", "rosacea", "irritat", "barrier",
        "anti-inflammatory", "oat", "bisabolol"
    ],
    "texture": [
        "texture", "exfoliat", "smooth", "glycolic", "lactic",
        "retinol", "resurface", "renew", "cell turnover",
        "uneven", "rough", "fine lines", "wrinkles"
    ],
    "dark_spots": [
        "dark spot", "brightening", "pigment", "vitamin c",
        "niacinamide", "kojic", "arbutin", "tranexamic",
        "hyperpigmentat", "uneven tone", "fade",
        "discolorat", "melasma", "age spot"
    ],
    "pores": [
        "pore", "minimiz", "tighten", "clay", "charcoal",
        "niacinamide", "sebum", "blackhead", "refine",
        "clear", "congest"
    ],
    "dark_circles": [
        "dark circle", "eye", "caffeine", "peptide",
        "under eye", "undereye", "puffiness", "brightening eye"
    ]
}

WEATHER_KEYWORD_MAP = {
    "high_uv": [
        "spf", "sunscreen", "uv", "sun protection",
        "vitamin c", "antioxidant", "pollution", "environmental"
    ],
    "humid": [
        "oil control", "mattif", "acne", "salicylic",
        "niacinamide", "clay", "lightweight", "gel",
        "water-based", "non-greasy"
    ],
    "dry_climate": [
        "hyaluronic", "moistur", "hydrat", "ceramide",
        "dry skin", "rich", "barrier", "nourish",
        "squalane", "shea", "occlusiv"
    ],
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

def parse_price(price_str) -> float:
    if not price_str or str(price_str) == "nan":
        return None
    cleaned = re.sub(r"[^\d.]", "", str(price_str))
    try:
        return float(cleaned)
    except:
        return None

def get_condition_tags(text: str) -> list:
    if not text:
        return None
    text_lower = text.lower()
    tags = []
    for condition, keywords in CONDITION_KEYWORD_MAP.items():
        if any(kw in text_lower for kw in keywords):
            tags.append(condition)
    return tags if tags else None

def get_skin_type_tags_kingabzpro(row) -> list:
    tags = []
    if row.get("Combination") == 1:
        tags.append("combination")
    if row.get("Dry") == 1:
        tags.append("dry")
    if row.get("Normal") == 1:
        tags.append("normal")
    if row.get("Oily") == 1:
        tags.append("oily")
    if row.get("Sensitive") == 1:
        tags.append("sensitive")
    return tags if tags else ["all"]

def get_skin_type_tags_text(text: str) -> list:
    if not text:
        return ["all"]
    text_lower = text.lower()
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
    return [i.strip() for i in str(ingredients_str).split(",") if i.strip()]

def seed_kingabzpro(db: Session) -> int:
    df = pd.read_csv("scripts/data/cosmetics.csv")
    print(f"Kingabzpro: {len(df)} products")
    seeded = 0
    brand_count = {}

    for _, row in df.iterrows():
        brand = str(row.get("Brand", "")).strip()
        name = str(row.get("Name", "")).strip()
        if not name or name == "nan":
            continue

        brand_count[brand] = brand_count.get(brand, 0) + 1
        if brand_count[brand] > 5:
            continue

        price_usd = parse_price(row.get("Price"))
        ingredients = parse_ingredients(row.get("Ingredients", ""))
        combined_text = f"{name} {row.get('Label', '')} {' '.join(ingredients)}"

        product = Product(
            name=name,
            brand=brand,
            category=normalize_category(row.get("Label")),
            key_ingredients=ingredients[:10],
            condition_tags=get_condition_tags(combined_text),
            skin_type_tags=get_skin_type_tags_kingabzpro(row),
            weather_tags=get_weather_tags(combined_text),
            price_usd=price_usd,
            price_npr=round(price_usd * USD_TO_NPR) if price_usd else None,
            price_tier=get_price_tier(price_usd),
            buy_link_global=None,
        )
        db.add(product)
        seeded += 1

    db.commit()
    print(f"Kingabzpro seeded: {seeded}")
    return seeded

def seed_eward96(db: Session) -> int:
    df = pd.read_csv("scripts/data/skincare_products.csv")
    print(f"eward96: {len(df)} products")
    seeded = 0
    brand_count = {}

    for _, row in df.iterrows():
        name = str(row.get("product_name", "")).strip()
        if not name or name == "nan":
            continue

        brand = name.split()[0] if name else "Unknown"
        brand_count[brand] = brand_count.get(brand, 0) + 1
        if brand_count[brand] > 5:
            continue

        price_usd = parse_price(row.get("price"))
        ingredients = parse_ingredients(row.get("ingredients", ""))
        combined_text = f"{name} {row.get('product_type', '')} {' '.join(ingredients)}"

        product = Product(
            name=name,
            brand=brand,
            category=normalize_category(row.get("product_type")),
            key_ingredients=ingredients[:10],
            condition_tags=get_condition_tags(combined_text),
            skin_type_tags=["all"],
            weather_tags=get_weather_tags(combined_text),
            price_usd=price_usd,
            price_npr=round(price_usd * USD_TO_NPR) if price_usd else None,
            price_tier=get_price_tier(price_usd),
            buy_link_global=str(row.get("product_url", "")) or None,
        )
        db.add(product)
        seeded += 1

    db.commit()
    print(f"eward96 seeded: {seeded}")
    return seeded

def seed_dermstore(db: Session) -> int:
    with open("scripts/data/dermstore_data.json", "r", encoding="utf-8") as f:
        data = json.load(f)
    print(f"Dermstore: {len(data)} products")
    seeded = 0
    brand_count = {}

    for item in data:
        name = str(item.get("title", "")).strip()
        brand = str(item.get("brand", "")).strip()
        if not name or not brand:
            continue

        brand_count[brand] = brand_count.get(brand, 0) + 1
        if brand_count[brand] > 5:
            continue

        price_usd = parse_price(item.get("price"))
        ingredients = parse_ingredients(item.get("ingredients", ""))
        skin_type_text = str(item.get("skin_type_and_concerns", ""))
        combined_text = f"{name} {item.get('category', '')} {skin_type_text} {' '.join(ingredients)}"

        product = Product(
            name=name,
            brand=brand,
            category=normalize_category(item.get("category", "")),
            key_ingredients=ingredients[:10],
            condition_tags=get_condition_tags(combined_text),
            skin_type_tags=get_skin_type_tags_text(skin_type_text),
            weather_tags=get_weather_tags(combined_text),
            price_usd=price_usd,
            price_npr=round(price_usd * USD_TO_NPR) if price_usd else None,
            price_tier=get_price_tier(price_usd),
            buy_link_global=str(item.get("url", "")) or None,
        )
        db.add(product)
        seeded += 1

    db.commit()
    print(f"Dermstore seeded: {seeded}")
    return seeded

def seed_products():
    db: Session = SessionLocal()
    try:
        total = 0
        total += seed_kingabzpro(db)
        total += seed_eward96(db)
        total += seed_dermstore(db)
        print(f"\nTotal products seeded: {total}")
    except Exception as e:
        db.rollback()
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_products()