import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.ingredient import Ingredient

CORE_INGREDIENTS = [
    {
        "name": "Niacinamide",
        "benefit_description": "A form of Vitamin B3 that reduces pore appearance, controls sebum, fades dark spots, strengthens the skin barrier, and calms redness and inflammation.",
        "condition_tags": ["acne", "pores", "dark_spots", "redness"],
        "skin_type_tags": ["all"],
        "conflict_with": [],
        "safe_time": "both",
        "weather_tags": ["humid"],
    },
    {
        "name": "Hyaluronic Acid",
        "benefit_description": "A powerful humectant that draws moisture into the skin, plumping fine lines and keeping skin hydrated throughout the day.",
        "condition_tags": ["dark_circles"],
        "skin_type_tags": ["all"],
        "conflict_with": [],
        "safe_time": "both",
        "weather_tags": ["dry_climate"],
    },
    {
        "name": "Salicylic Acid",
        "benefit_description": "A beta hydroxy acid (BHA) that penetrates pores to dissolve excess sebum and dead skin cells, reducing acne, blackheads, and pore congestion.",
        "condition_tags": ["acne", "pores", "texture"],
        "skin_type_tags": ["oily", "combination"],
        "conflict_with": ["retinol", "glycolic acid", "lactic acid"],
        "safe_time": "both",
        "weather_tags": ["humid"],
    },
    {
        "name": "Retinol",
        "benefit_description": "A Vitamin A derivative that accelerates cell turnover, stimulates collagen production, reduces fine lines, unclogs pores, and improves skin texture.",
        "condition_tags": ["texture", "pores", "dark_circles", "dark_spots"],
        "skin_type_tags": ["all"],
        "conflict_with": ["vitamin c", "glycolic acid", "lactic acid", "salicylic acid", "benzoyl peroxide", "mandelic acid"],
        "safe_time": "night",
        "weather_tags": [],
    },
    {
        "name": "Vitamin C",
        "benefit_description": "A potent antioxidant that brightens skin, fades hyperpigmentation and dark spots, protects against UV and environmental damage, and boosts collagen synthesis.",
        "condition_tags": ["dark_spots", "redness"],
        "skin_type_tags": ["all"],
        "conflict_with": ["retinol", "glycolic acid", "lactic acid", "benzoyl peroxide"],
        "safe_time": "morning",
        "weather_tags": ["high_uv"],
    },
    {
        "name": "Aloe Vera",
        "benefit_description": "A soothing botanical that calms irritation, reduces redness, hydrates dry skin, and has mild antibacterial properties helpful for acne-prone skin.",
        "condition_tags": ["redness", "acne"],
        "skin_type_tags": ["all"],
        "conflict_with": [],
        "safe_time": "both",
        "weather_tags": ["dry_climate"],
    },
    {
        "name": "Ceramides",
        "benefit_description": "Lipids naturally found in the skin barrier that lock in moisture, protect against environmental damage, and restore the skin's protective barrier function.",
        "condition_tags": ["redness", "texture"],
        "skin_type_tags": ["dry", "sensitive"],
        "conflict_with": [],
        "safe_time": "both",
        "weather_tags": ["dry_climate"],
    },
    {
        "name": "Glycolic Acid",
        "benefit_description": "An alpha hydroxy acid (AHA) that exfoliates the skin surface, removes dead skin cells, improves texture, brightens complexion, and stimulates collagen production.",
        "condition_tags": ["texture", "dark_spots", "pores"],
        "skin_type_tags": ["oily", "combination", "normal"],
        "conflict_with": ["retinol", "salicylic acid", "vitamin c"],
        "safe_time": "night",
        "weather_tags": [],
    },
    {
        "name": "Lactic Acid",
        "benefit_description": "A gentle alpha hydroxy acid that exfoliates dead skin cells, improves texture and tone, and is suitable for sensitive skin due to its larger molecular size.",
        "condition_tags": ["texture", "dark_spots"],
        "skin_type_tags": ["all"],
        "conflict_with": ["retinol", "salicylic acid", "vitamin c"],
        "safe_time": "night",
        "weather_tags": [],
    },
    {
        "name": "Centella Asiatica",
        "benefit_description": "A calming botanical also known as Cica that soothes redness, strengthens the skin barrier, promotes wound healing, and reduces inflammation.",
        "condition_tags": ["redness", "acne"],
        "skin_type_tags": ["sensitive", "all"],
        "conflict_with": [],
        "safe_time": "both",
        "weather_tags": ["humid"],
    },
    {
        "name": "Benzoyl Peroxide",
        "benefit_description": "An antibacterial agent that kills acne-causing bacteria, reduces inflammation, and clears existing breakouts effectively.",
        "condition_tags": ["acne"],
        "skin_type_tags": ["oily", "combination"],
        "conflict_with": ["retinol", "vitamin c"],
        "safe_time": "night",
        "weather_tags": [],
    },
    {
        "name": "Alpha Arbutin",
        "benefit_description": "A stable brightening ingredient that inhibits melanin production to fade dark spots, hyperpigmentation, and uneven skin tone safely.",
        "condition_tags": ["dark_spots"],
        "skin_type_tags": ["all"],
        "conflict_with": ["glycolic acid", "lactic acid", "salicylic acid"],
        "safe_time": "both",
        "weather_tags": [],
    },
    {
        "name": "Tranexamic Acid",
        "benefit_description": "A brightening ingredient that targets hyperpigmentation, melasma, and dark spots by blocking the pathways that trigger excess melanin production.",
        "condition_tags": ["dark_spots", "redness"],
        "skin_type_tags": ["all"],
        "conflict_with": [],
        "safe_time": "both",
        "weather_tags": [],
    },
    {
        "name": "Azelaic Acid",
        "benefit_description": "A multitasking acid that reduces acne-causing bacteria, calms redness and rosacea, fades post-inflammatory hyperpigmentation, and is safe for sensitive skin.",
        "condition_tags": ["acne", "redness", "dark_spots"],
        "skin_type_tags": ["all"],
        "conflict_with": [],
        "safe_time": "both",
        "weather_tags": [],
    },
    {
        "name": "Kojic Acid",
        "benefit_description": "A natural brightening agent derived from fungi that inhibits tyrosinase enzyme activity to reduce melanin production and fade dark spots.",
        "condition_tags": ["dark_spots"],
        "skin_type_tags": ["all"],
        "conflict_with": ["glycolic acid", "lactic acid", "salicylic acid"],
        "safe_time": "night",
        "weather_tags": [],
    },
    {
        "name": "Tea Tree Oil",
        "benefit_description": "A natural antibacterial and anti-inflammatory essential oil that fights acne-causing bacteria, reduces blemishes, and soothes inflamed skin.",
        "condition_tags": ["acne"],
        "skin_type_tags": ["oily", "combination"],
        "conflict_with": [],
        "safe_time": "both",
        "weather_tags": [],
    },
    {
        "name": "Zinc",
        "benefit_description": "A mineral with antibacterial and anti-inflammatory properties that controls sebum production, reduces acne, and minimizes pore appearance.",
        "condition_tags": ["acne", "pores"],
        "skin_type_tags": ["oily", "combination"],
        "conflict_with": [],
        "safe_time": "both",
        "weather_tags": ["high_uv"],
    },
    {
        "name": "Green Tea Extract",
        "benefit_description": "A powerful antioxidant that protects against free radical damage, reduces redness and inflammation, controls sebum, and soothes sensitive skin.",
        "condition_tags": ["redness", "acne"],
        "skin_type_tags": ["all"],
        "conflict_with": [],
        "safe_time": "both",
        "weather_tags": ["high_uv"],
    },
    {
        "name": "Squalane",
        "benefit_description": "A lightweight emollient that mimics the skin's natural oils, deeply moisturizes without clogging pores, and strengthens the skin barrier.",
        "condition_tags": ["redness", "texture"],
        "skin_type_tags": ["all"],
        "conflict_with": [],
        "safe_time": "both",
        "weather_tags": ["dry_climate"],
    },
    {
        "name": "Peptides",
        "benefit_description": "Short chains of amino acids that signal the skin to produce more collagen, reduce fine lines, firm skin, and improve elasticity.",
        "condition_tags": ["dark_circles", "texture"],
        "skin_type_tags": ["all"],
        "conflict_with": [],
        "safe_time": "both",
        "weather_tags": [],
    },
    {
        "name": "Bakuchiol",
        "benefit_description": "A plant-based retinol alternative that improves texture, reduces fine lines, and fades dark spots without the irritation associated with retinol.",
        "condition_tags": ["texture", "dark_spots"],
        "skin_type_tags": ["sensitive", "all"],
        "conflict_with": [],
        "safe_time": "night",
        "weather_tags": [],
    },
    {
        "name": "Colloidal Oatmeal",
        "benefit_description": "A finely ground oat ingredient that soothes irritated and inflamed skin, relieves redness, strengthens the skin barrier, and locks in moisture.",
        "condition_tags": ["redness"],
        "skin_type_tags": ["sensitive", "dry"],
        "conflict_with": [],
        "safe_time": "both",
        "weather_tags": ["dry_climate"],
    },
    {
        "name": "Allantoin",
        "benefit_description": "A soothing ingredient that calms irritation, promotes skin cell regeneration, and is gentle enough for the most sensitive skin types.",
        "condition_tags": ["redness"],
        "skin_type_tags": ["sensitive", "all"],
        "conflict_with": [],
        "safe_time": "both",
        "weather_tags": [],
    },
    {
        "name": "Mandelic Acid",
        "benefit_description": "A gentle AHA derived from almonds that exfoliates skin, improves texture, fades dark spots, and is suitable for sensitive skin due to its larger molecular size.",
        "condition_tags": ["texture", "dark_spots", "acne"],
        "skin_type_tags": ["sensitive", "all"],
        "conflict_with": ["retinol"],
        "safe_time": "night",
        "weather_tags": [],
    },
    {
        "name": "Resveratrol",
        "benefit_description": "A powerful antioxidant found in grapes that neutralizes free radicals, reduces inflammation, and protects skin from environmental damage.",
        "condition_tags": ["redness", "texture"],
        "skin_type_tags": ["all"],
        "conflict_with": [],
        "safe_time": "both",
        "weather_tags": ["high_uv"],
    },
    {
        "name": "Ferulic Acid",
        "benefit_description": "An antioxidant that enhances the stability and effectiveness of Vitamins C and E, and protects the skin from UV and environmental damage.",
        "condition_tags": ["dark_spots", "texture"],
        "skin_type_tags": ["all"],
        "conflict_with": [],
        "safe_time": "morning",
        "weather_tags": ["high_uv"],
    },
    {
        "name": "Bisabolol",
        "benefit_description": "A soothing ingredient derived from chamomile that calms redness, reduces irritation, and has mild antibacterial properties.",
        "condition_tags": ["redness"],
        "skin_type_tags": ["sensitive", "all"],
        "conflict_with": [],
        "safe_time": "both",
        "weather_tags": [],
    },
    {
        "name": "Rosehip Oil",
        "benefit_description": "A natural oil rich in Vitamin A and fatty acids that improves skin texture, fades scars and dark spots, and deeply nourishes dry skin.",
        "condition_tags": ["dark_spots", "texture"],
        "skin_type_tags": ["dry", "normal"],
        "conflict_with": [],
        "safe_time": "night",
        "weather_tags": ["dry_climate"],
    },
    {
        "name": "Witch Hazel",
        "benefit_description": "A natural astringent that tightens pores, controls excess oil, reduces inflammation, and helps clear acne-prone skin.",
        "condition_tags": ["acne", "pores"],
        "skin_type_tags": ["oily", "combination"],
        "conflict_with": [],
        "safe_time": "both",
        "weather_tags": ["humid"],
    },
    {
        "name": "Clay",
        "benefit_description": "A natural mineral that absorbs excess sebum, unclogs pores, draws out impurities, and mattifies oily skin.",
        "condition_tags": ["acne", "pores"],
        "skin_type_tags": ["oily", "combination"],
        "conflict_with": [],
        "safe_time": "both",
        "weather_tags": ["humid"],
    },
]


def seed_core_ingredients():
    db: Session = SessionLocal()
    seeded = 0
    skipped = 0

    try:
        for data in CORE_INGREDIENTS:
            existing = db.query(Ingredient).filter(
                Ingredient.name == data["name"]
            ).first()
            if existing:
                skipped += 1
                continue

            ingredient = Ingredient(**data)
            db.add(ingredient)
            seeded += 1

        db.commit()
        print(f"Seeded: {seeded} core ingredients")
        print(f"Skipped (already exist): {skipped}")

    except Exception as e:
        db.rollback()
        print(f"Error: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    seed_core_ingredients()