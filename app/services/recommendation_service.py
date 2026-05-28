from groq import Groq
from app.core.config import settings

client = Groq(api_key=settings.GROQ_API_KEY)

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
        messages=[
            {"role": "user", "content": prompt}
        ],
        max_tokens=1024
    ) 
    
    return response.choices[0].message.content