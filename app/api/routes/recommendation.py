import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.scan import Scan
from app.models.user import User
from app.services.quiz_service import get_skin_profile
from app.services.journal_service import get_journal_summary_for_report
from app.services.recommendation_service import (
    generate_skin_report,
    get_spf_recommendation,
    ingredient_engine,
    product_engine,
)

logger = logging.getLogger("skincare_api")

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
        "wrinkles_score": scan.wrinkles_score,
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

    # Now uses the same ingredient_engine() as /products, instead of the old
    # separate get_recommended_ingredients() — single source of truth so the
    # Overview tab's ingredient list can never disagree with the Products tab.
    ranked_ingredients = ingredient_engine(cv_scores, skin_profile_dict, weather, db)
    ingredient_names = [
        i["name"] for i in ranked_ingredients.get("morning", []) + ranked_ingredients.get("night", [])
    ]
    ingredient_names = list(dict.fromkeys(ingredient_names))  # dedupe, preserve order

    spf = get_spf_recommendation(scan.uv_index)
    journal_summary = get_journal_summary_for_report(db, current_user.id)
    skin_report = generate_skin_report(cv_scores, skin_profile_dict, weather, ingredient_names, journal_summary)
    logger.info(f"Recommendation generated: user_id={current_user.id}, scan_id={scan.id}")

    return {
        "ingredients": ingredient_names,
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
        "wrinkles_score": scan.wrinkles_score,
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
    