from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.scan import Scan
from app.services.cv_service import analyze_skin, check_photo_quality
from app.services.weather_service import get_full_weather

router = APIRouter(prefix="/scan", tags=["Scan"])

@router.post("/analyze")
async def analyze(
    file: UploadFile = File(...),
    lat: float = 27.7172,
    lon: float = 85.3240,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Read image
    image_bytes = await file.read()

    # Check photo quality first
    quality = check_photo_quality(image_bytes)
    if not quality["passed"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=quality["issues"]
        )

    # Run CV analysis
    cv_scores = analyze_skin(image_bytes)

    # Get weather data
    try:
        weather = await get_full_weather(lat, lon)
    except Exception:
        weather = {
            "temperature": None,
            "humidity": None,
            "weather_condition": None,
            "uv_index": None,
            "uv_max": None,
            "city": None
        }

    # Save scan to database
    scan = Scan(
        user_id=current_user.id,
        scan_type="full",
        acne_score=cv_scores["acne_score"],
        redness_score=cv_scores["redness_score"],
        texture_score=cv_scores["texture_score"],
        dark_spots_score=cv_scores["dark_spots_score"],
        pores_score=cv_scores["pores_score"],
        dark_circles_score=cv_scores["dark_circles_score"],
        photo_confidence=cv_scores["photo_confidence"],
        uv_index=weather.get("uv_index"),
        humidity=weather.get("humidity"),
        temperature=weather.get("temperature"),
        weather_condition=weather.get("weather_condition")
    )
    db.add(scan)
    db.commit()
    db.refresh(scan)

    return {
        "scan_id": scan.id,
        "cv_scores": cv_scores,
        "weather": weather
    }

@router.get("/history")
def get_scan_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    scans = db.query(Scan).filter(
        Scan.user_id == current_user.id
    ).order_by(Scan.created_at.desc()).all()
    return scans