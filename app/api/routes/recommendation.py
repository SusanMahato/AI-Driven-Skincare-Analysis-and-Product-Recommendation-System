from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.scan import Scan
from app.services.recommendation_service import (
    get_recommended_ingredients,
    get_spf_recommendation,
    generate_skin_report,
    ingredient_engine,
    product_engine,
)
from app.services.quiz_service import get_skin_profile

router = APIRouter(prefix="/recommendation", tags=["Recommendation"])


@router.get("/latest")
def get_latest_recommendation(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    scan = db.query(Scan).filter(
        Scan.user_id == current_user.id
    ).order_by(Scan.created_at.desc()).first()

    if not scan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No scan found. Please do a scan first."
        )

    skin_profile = get_skin_profile(db, current_user.id)
    if not skin_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No skin profile found. Please complete the quiz first."
        )

    cv_scores = {
        "acne_score": scan.acne_score,
        "redness_score": scan.redness_score,
        "texture_score": scan.texture_score,
        "dark_spots_score": scan.dark_spots_score,
        "pores_score": scan.pores_score,
        "dark_circles_score": scan.dark_circles_score
    }

    skin_profile_dict = {
        "skin_type": skin_profile.skin_type,
        "age_range": skin_profile.age_range,
        "concern_one": skin_profile.concern_one,
        "concern_two": skin_profile.concern_two,
        "skin_goal": skin_profile.skin_goal,
        "sun_exposure": skin_profile.sun_exposure,
        "sensitivity": skin_profile.sensitivity,
        "budget_tier": skin_profile.budget_tier,
    }

    weather = {
        "temperature": scan.temperature,
        "humidity": scan.humidity,
        "weather_condition": scan.weather_condition,
        "uv_index": scan.uv_index
    }

    ingredients = get_recommended_ingredients(cv_scores, skin_profile_dict)
    spf = get_spf_recommendation(scan.uv_index)
    skin_report = generate_skin_report(cv_scores, skin_profile_dict, weather, ingredients)

    return {
        "ingredients": ingredients,
        "recommended_spf": spf,
        "morning_routine": ["Cleanser", "Serum", f"SPF {spf}"],
        "night_routine": ["Cleanser", "Moisturizer"],
        "skin_report": skin_report
    }


@router.get("/products")
def get_product_recommendations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    scan = db.query(Scan).filter(
        Scan.user_id == current_user.id
    ).order_by(Scan.created_at.desc()).first()

    if not scan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No scan found. Please do a scan first."
        )

    skin_profile = get_skin_profile(db, current_user.id)
    if not skin_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No skin profile found. Please complete the quiz first."
        )

    cv_scores = {
        "acne_score": scan.acne_score,
        "redness_score": scan.redness_score,
        "texture_score": scan.texture_score,
        "dark_spots_score": scan.dark_spots_score,
        "pores_score": scan.pores_score,
        "dark_circles_score": scan.dark_circles_score
    }

    skin_profile_dict = {
        "skin_type": skin_profile.skin_type,
        "age_range": skin_profile.age_range,
        "concern_one": skin_profile.concern_one,
        "concern_two": skin_profile.concern_two,
        "skin_goal": skin_profile.skin_goal,
        "sun_exposure": skin_profile.sun_exposure,
        "sensitivity": skin_profile.sensitivity,
        "budget_tier": skin_profile.budget_tier,
    }

    weather = {
        "temperature": scan.temperature,
        "humidity": scan.humidity,
        "weather_condition": scan.weather_condition,
        "uv_index": scan.uv_index
    }

    ranked_ingredients = ingredient_engine(cv_scores, skin_profile_dict, weather, db)
    products = product_engine(ranked_ingredients, cv_scores, skin_profile_dict, weather, db)

    return {
        "ingredients": ranked_ingredients,
        "products": products,
    }