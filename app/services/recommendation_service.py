from groq import Groq
from sqlalchemy.orm import Session
from app.core.config import settings
from app.models.ingredient import Ingredient
from app.models.product import Product

client = Groq(api_key=settings.GROQ_API_KEY)

# ─────────────────────────────────────────────
# EXISTING FUNCTIONS — DO NOT MODIFY
# ─────────────────────────────────────────────

def get_spf_recommendation(uv_index: float) -> int:
    if uv_index is None:
        return 30
    if uv_index < 3:
        return 30
    elif uv_index <= 6:
        return 40
    else:
        return 50

def get_recommended_ingredients(cv_scores: dict, skin_profile: dict) -> list:
    ingredients = []

    if cv_scores.get("acne_score", 0) > 0.5 or skin_profile.get("concern_one") == "Acne":
        ingredients.append("Salicylic Acid")
        ingredients.append("Niacinamide")

    if cv_scores.get("redness_score", 0) > 0.5 or skin_profile.get("concern_one") == "Redness":
        ingredients.append("Centella Asiatica")
        ingredients.append("Azelaic Acid")

    if cv_scores.get("texture_score", 0) > 0.5:
        ingredients.append("Glycolic Acid")
        ingredients.append("Retinol")

    if cv_scores.get("pores_score", 0) > 0.5 or skin_profile.get("concern_one") == "Pores":
        ingredients.append("Niacinamide")
        ingredients.append("Salicylic Acid")

    if cv_scores.get("dark_circles_score", 0) > 0.5 or skin_profile.get("concern_one") == "Dark circles":
        ingredients.append("Caffeine")
        ingredients.append("Peptides")

    if skin_profile.get("skin_type") == "Dry" or skin_profile.get("concern_one") == "Dryness":
        ingredients.append("Hyaluronic Acid")
        ingredients.append("Ceramides")

    if skin_profile.get("skin_type") == "Oily" or skin_profile.get("concern_one") == "Oiliness":
        ingredients.append("Niacinamide")
        ingredients.append("Zinc")

    if cv_scores.get("dark_spots_score", 0) > 0.5 or skin_profile.get("concern_one") == "Dark spots":
        ingredients.append("Vitamin C")
        ingredients.append("Alpha Arbutin")

    if skin_profile.get("concern_one") == "Wrinkles" or skin_profile.get("skin_goal") == "Anti-aging":
        ingredients.append("Retinol")
        ingredients.append("Peptides")

    ingredients.append("SPF " + str(get_spf_recommendation(None)))
    return list(dict.fromkeys(ingredients))

def generate_skin_report(
    cv_scores: dict,
    skin_profile: dict,
    weather: dict,
    ingredients: list
) -> str:
    prompt = (
        "You are a professional skincare consultant. Write a personalized skin analysis report.\n\n"
        f"SKIN SCORES (0-1, higher = more severe):\n"
        f"- Acne: {cv_scores.get('acne_score')}\n"
        f"- Redness: {cv_scores.get('redness_score')}\n"
        f"- Texture: {cv_scores.get('texture_score')}\n"
        f"- Dark Spots: {cv_scores.get('dark_spots_score')}\n"
        f"- Pores: {cv_scores.get('pores_score')}\n"
        f"- Dark Circles: {cv_scores.get('dark_circles_score')}\n\n"
        f"SKIN PROFILE:\n"
        f"- Skin Type: {skin_profile.get('skin_type')}\n"
        f"- Age Range: {skin_profile.get('age_range')}\n"
        f"- Main Concern: {skin_profile.get('concern_one')}\n"
        f"- Secondary Concern: {skin_profile.get('concern_two')}\n"
        f"- Skin Goal: {skin_profile.get('skin_goal')}\n"
        f"- Sun Exposure: {skin_profile.get('sun_exposure')}\n"
        f"- Sensitivity: {skin_profile.get('sensitivity')}\n\n"
        f"WEATHER TODAY:\n"
        f"- Temperature: {weather.get('temperature')}C\n"
        f"- Humidity: {weather.get('humidity')}%\n"
        f"- Weather: {weather.get('weather_condition')}\n"
        f"- UV Index: {weather.get('uv_index')}\n\n"
        f"RECOMMENDED INGREDIENTS: {', '.join(ingredients)}\n\n"
        "Write in second person. No greetings, no sign-offs, no placeholders. "
        "Cover: what was detected, how weather affects skin, why each ingredient was chosen, "
        "usage warnings, and realistic expectations. Maximum 200 words."
    )

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=1024
    )

    return response.choices[0].message.content


# ─────────────────────────────────────────────
# NEW — INGREDIENT ENGINE
# ─────────────────────────────────────────────

SCORE_THRESHOLD = 0.10

SCORE_TO_CONDITION = {
    "acne_score": "acne",
    "redness_score": "redness",
    "texture_score": "texture",
    "dark_spots_score": "dark_spots",
    "pores_score": "pores",
    "dark_circles_score": "dark_circles",
}

NIGHT_PREFERRED = [
    "retinol", "bakuchiol", "glycolic acid", "lactic acid",
    "mandelic acid", "benzoyl peroxide", "kojic acid"
]

MORNING_PREFERRED = [
    "vitamin c", "ascorbic acid", "caffeine", "niacinamide"
]

def get_active_conditions(cv_scores: dict) -> dict:
    active = {}
    for key, condition in SCORE_TO_CONDITION.items():
        score = cv_scores.get(key, 0) or 0
        if score > SCORE_THRESHOLD:
            active[condition] = score
    return active

def ingredient_engine(
    cv_scores: dict,
    skin_profile: dict,
    weather: dict,
    db: Session
) -> dict:
    active_conditions = get_active_conditions(cv_scores)
    skin_type = str(skin_profile.get("skin_type", "")).lower()

    all_ingredients = db.query(Ingredient).all()

    scored = []
    for ing in all_ingredients:
        score = 0

        if ing.skin_type_tags:
            if skin_type and "all" not in ing.skin_type_tags:
                if skin_type not in ing.skin_type_tags:
                    continue

        if ing.condition_tags:
            for condition, severity in active_conditions.items():
                if condition in ing.condition_tags:
                    score += 3
                    if severity > 0.6:
                        score += 2

        if score == 0:
            continue

        if ing.skin_type_tags and skin_type in ing.skin_type_tags:
            score += 1

        scored.append({
            "id": ing.id,
            "name": ing.name,
            "benefit": ing.benefit_description,
            "safe_time": ing.safe_time or "both",
            "conflict_with": ing.conflict_with or [],
            "condition_tags": ing.condition_tags or [],
            "weather_tags": ing.weather_tags or [],
            "score": score,
            "conflict_warning": None,
        })

    scored.sort(key=lambda x: x["score"], reverse=True)

    morning = []
    night = []
    used_morning_names = []
    used_night_names = []

    for ing in scored:
        name_lower = ing["name"].lower()
        safe_time = ing["safe_time"]
        conflicts = [c.lower() for c in ing["conflict_with"]]

        if safe_time == "morning":
            morning.append(ing)
            used_morning_names.append(name_lower)

        elif safe_time == "night":
            night.append(ing)
            used_night_names.append(name_lower)

        else:
            is_night_preferred = any(n in name_lower for n in NIGHT_PREFERRED)
            is_morning_preferred = any(n in name_lower for n in MORNING_PREFERRED)
            has_morning_conflict = any(c in used_morning_names for c in conflicts)
            has_night_conflict = any(c in used_night_names for c in conflicts)

            if is_night_preferred:
                night.append(ing)
                used_night_names.append(name_lower)
            elif is_morning_preferred:
                morning.append(ing)
                used_morning_names.append(name_lower)
            elif has_morning_conflict and not has_night_conflict:
                night.append(ing)
                used_night_names.append(name_lower)
            else:
                if len(morning) <= len(night):
                    morning.append(ing)
                    used_morning_names.append(name_lower)
                else:
                    night.append(ing)
                    used_night_names.append(name_lower)

    morning = morning[:8]
    night = night[:8]

    conflict_warnings = []
    all_placed = morning + night
    for ing in all_placed:
        for conflict in ing["conflict_with"]:
            conflicting = next(
                (i for i in all_placed if conflict.lower() in i["name"].lower()), None
            )
            if conflicting:
                warning = f"{ing['name']} conflicts with {conflicting['name']} — use at different times"
                if warning not in conflict_warnings:
                    conflict_warnings.append(warning)

    return {
        "morning": morning,
        "night": night,
        "conflict_warnings": conflict_warnings,
    }


# ─────────────────────────────────────────────
# NEW — PRODUCT ENGINE
# ─────────────────────────────────────────────

ROUTINE_STEPS_MORNING = ["cleanser", "serum", "moisturizer", "sunscreen", "eye_cream"]
ROUTINE_STEPS_NIGHT = ["cleanser", "treatment", "moisturizer", "eye_cream"]

CATEGORY_MAP_ORDERED = [
    ("toner", "toner"),
    ("mist", "toner"),
    ("eye cream", "eye_cream"),
    ("eye serum", "eye_cream"),
    ("eye gel", "eye_cream"),
    ("spot treatment", "treatment"),
    ("treatment", "treatment"),
    ("retinol", "treatment"),
    ("sunscreen", "sunscreen"),
    ("spf", "sunscreen"),
    ("serum oil", "serum"),
    ("essence", "serum"),
    ("serum", "serum"),
    ("face wash", "cleanser"),
    ("foam", "cleanser"),
    ("foaming", "cleanser"),
    ("micellar", "cleanser"),
    ("makeup remover", "cleanser"),
    ("cleanser", "cleanser"),
    ("night cream", "moisturizer"),
    ("day cream", "moisturizer"),
    ("lotion", "moisturizer"),
    ("balm", "moisturizer"),
    ("moisturizer", "moisturizer"),
    ("moisturiser", "moisturizer"),
    ("peel", "exfoliant"),
    ("scrub", "exfoliant"),
    ("exfoliant", "exfoliant"),
    ("mask", "mask"),
    ("facial oil", "facial_oil"),
]

def normalize_category(raw: str) -> str:
    if not raw or str(raw) == "nan":
        return "other"
    raw_lower = str(raw).lower().strip()
    for key, val in CATEGORY_MAP_ORDERED:
        if key in raw_lower:
            return val
    return "other"

def get_weather_context(weather: dict) -> list:
    tags = []
    uv = weather.get("uv_index") or 0
    humidity = weather.get("humidity") or 0
    if uv > 5:
        tags.append("high_uv")
    if humidity > 70:
        tags.append("humid")
    if humidity < 30:
        tags.append("dry_climate")
    return tags

def score_product(product, active_conditions: dict, skin_type: str, weather_tags: list) -> int:
    score = 0
    if product.condition_tags:
        for condition in active_conditions:
            if condition in product.condition_tags:
                score += 3
    if product.weather_tags:
        for tag in weather_tags:
            if tag in product.weather_tags:
                score += 2
    if product.skin_type_tags:
        if skin_type and skin_type in product.skin_type_tags:
            score += 2
    return score

def apply_diversity(products: list) -> list:
    seen_brands = set()
    result = []
    for p in products:
        if p["brand"] not in seen_brands:
            result.append(p)
            seen_brands.add(p["brand"])
    return result

def generate_why_it_suits_you(product_name: str, matched_ingredients: list, cv_scores: dict) -> str:
    top_condition = max(cv_scores, key=lambda k: cv_scores.get(k) or 0)
    top_score = round((cv_scores.get(top_condition) or 0) * 100)
    condition_label = top_condition.replace("_score", "").replace("_", " ")

    if matched_ingredients:
        ing = matched_ingredients[0]
        prompt = (
            f"In exactly 20 words or less, explain why '{product_name}' suits someone "
            f"with {top_score}% {condition_label} score. Mention '{ing}'. "
            f"Be specific. No fluff. No ratings. No popularity."
        )
    else:
        prompt = (
            f"In exactly 20 words or less, explain why '{product_name}' suits someone "
            f"with {top_score}% {condition_label} score. Be specific. No fluff."
        )

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=60
        )
        return response.choices[0].message.content.strip()
    except:
        return f"Targets your {condition_label} concern directly."


def build_routine(products_list: list, steps: list, exclude_ids: set = None) -> tuple:
    routine = {}
    used_ids = set(exclude_ids) if exclude_ids else set()
    for step in steps:
        match = next(
            (p for p in products_list if p["category"] == step and p["id"] not in used_ids),
            None
        )
        if match:
            routine[step] = match
            used_ids.add(match["id"])
    return routine, used_ids


def product_engine(
    ranked_ingredients: dict,
    cv_scores: dict,
    skin_profile: dict,
    weather: dict,
    db: Session
) -> dict:
    active_conditions = get_active_conditions(cv_scores)
    skin_type = str(skin_profile.get("skin_type", "")).lower()
    weather_tags = get_weather_context(weather)

    matched_ingredient_names = [
        i["name"].lower()
        for i in ranked_ingredients.get("morning", []) + ranked_ingredients.get("night", [])
    ]

    all_products = db.query(Product).all()

    scored_products = []
    for product in all_products:
        product_ings = [i.lower() for i in (product.key_ingredients or [])]
        matched = [i for i in matched_ingredient_names if any(i in pi for pi in product_ings)]
        fixed_category = normalize_category(product.category)

        # For cleansers — relax matching, just need condition tag match
        if not matched and fixed_category == "cleanser":
            score = score_product(product, active_conditions, skin_type, weather_tags)
            if score == 0:
                continue
            scored_products.append({
                "id": product.id,
                "name": product.name,
                "brand": product.brand,
                "category": fixed_category,
                "price_usd": product.price_usd,
                "price_npr": product.price_npr,
                "price_tier": product.price_tier,
                "key_ingredients": product.key_ingredients or [],
                "matched_ingredients": [],
                "safe_time": "both",
                "buy_link_global": product.buy_link_global,
                "score": score,
                "why_it_suits_you": None,
                "conflict_warning": None,
            })
            continue

        if not matched:
            continue

        score = score_product(product, active_conditions, skin_type, weather_tags)
        if score == 0:
            continue

        scored_products.append({
            "id": product.id,
            "name": product.name,
            "brand": product.brand,
            "category": fixed_category,
            "price_usd": product.price_usd,
            "price_npr": product.price_npr,
            "price_tier": product.price_tier,
            "key_ingredients": product.key_ingredients or [],
            "matched_ingredients": matched,
            "safe_time": "morning" if fixed_category == "sunscreen" else "both",
            "buy_link_global": product.buy_link_global,
            "score": score,
            "why_it_suits_you": None,
            "conflict_warning": None,
        })

    scored_products.sort(key=lambda x: x["score"], reverse=True)
    diverse_products = apply_diversity(scored_products)

    budget = [p for p in diverse_products if p["price_tier"] == "budget"]
    premium = [p for p in diverse_products if p["price_tier"] == "premium"]

    # Generate LLM explanations for top 10 only
    top_products = diverse_products[:10]
    for p in top_products:
        p["why_it_suits_you"] = generate_why_it_suits_you(
            p["name"], p["matched_ingredients"], cv_scores
        )

    # Best match — no product reused across morning and night
    morning_products = [p for p in diverse_products if p["safe_time"] in ["morning", "both"]]
    night_products = [p for p in diverse_products if p["safe_time"] in ["night", "both"]]
    best_morning, used_best = build_routine(morning_products, ROUTINE_STEPS_MORNING)
    best_night, _ = build_routine(night_products, ROUTINE_STEPS_NIGHT, exclude_ids=used_best)

    # Budget picks — no product reused across morning and night
    budget_morning_products = [p for p in budget if p["safe_time"] in ["morning", "both"]]
    budget_night_products = [p for p in budget if p["safe_time"] in ["night", "both"]]
    budget_morning, used_budget = build_routine(budget_morning_products, ROUTINE_STEPS_MORNING)
    budget_night, _ = build_routine(budget_night_products, ROUTINE_STEPS_NIGHT, exclude_ids=used_budget)

    # Premium — no product reused across morning and night
    premium_morning_products = [p for p in premium if p["safe_time"] in ["morning", "both"]]
    premium_night_products = [p for p in premium if p["safe_time"] in ["night", "both"]]
    premium_morning, used_premium = build_routine(premium_morning_products, ROUTINE_STEPS_MORNING)
    premium_night, _ = build_routine(premium_night_products, ROUTINE_STEPS_NIGHT, exclude_ids=used_premium)

    return {
        "best_match": {"morning": best_morning, "night": best_night},
        "budget_picks": {"morning": budget_morning, "night": budget_night},
        "premium": {"morning": premium_morning, "night": premium_night},
    }

    # Generate LLM explanations for top 10 only
    top_products = diverse_products[:10]
    for p in top_products:
        p["why_it_suits_you"] = generate_why_it_suits_you(
            p["name"], p["matched_ingredients"], cv_scores
        )

    # Best match — no product reused across morning and night
    morning_products = [p for p in diverse_products if p["safe_time"] in ["morning", "both"]]
    night_products = [p for p in diverse_products if p["safe_time"] in ["night", "both"]]
    best_morning, used_best = build_routine(morning_products, ROUTINE_STEPS_MORNING)
    best_night, _ = build_routine(night_products, ROUTINE_STEPS_NIGHT, exclude_ids=used_best)

    # Budget picks — no product reused across morning and night
    budget_morning_products = [p for p in budget if p["safe_time"] in ["morning", "both"]]
    budget_night_products = [p for p in budget if p["safe_time"] in ["night", "both"]]
    budget_morning, used_budget = build_routine(budget_morning_products, ROUTINE_STEPS_MORNING)
    budget_night, _ = build_routine(budget_night_products, ROUTINE_STEPS_NIGHT, exclude_ids=used_budget)

    # Premium — no product reused across morning and night
    premium_morning_products = [p for p in premium if p["safe_time"] in ["morning", "both"]]
    premium_night_products = [p for p in premium if p["safe_time"] in ["night", "both"]]
    premium_morning, used_premium = build_routine(premium_morning_products, ROUTINE_STEPS_MORNING)
    premium_night, _ = build_routine(premium_night_products, ROUTINE_STEPS_NIGHT, exclude_ids=used_premium)

    return {
        "best_match": {"morning": best_morning, "night": best_night},
        "budget_picks": {"morning": budget_morning, "night": budget_night},
        "premium": {"morning": premium_morning, "night": premium_night},
    }