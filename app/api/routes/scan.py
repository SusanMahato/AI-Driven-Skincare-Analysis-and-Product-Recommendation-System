from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.scan import Scan
from app.services.cv_service import analyze_skin, check_photo_quality
from app.services.weather_service import get_full_weather
from PIL import Image
import os
import uuid
import io

router = APIRouter(prefix="/scan", tags=["Scan"])

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), '..', '..', '..', 'uploaded_scans')
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Config: score-scale is 0.0–1.0, higher = more severe.
# A delta smaller than this magnitude is treated as noise, not real change.
COMPARISON_THRESHOLD = 0.03

CONDITION_FIELDS = [
    "acne_score",
    "redness_score",
    "wrinkles_score",
    "dark_spots_score",
    "pores_score",
    "dark_circles_score",
]

# --- File upload validation config ---
ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png"}
ALLOWED_PIL_FORMATS = {"JPEG", "PNG"}
MAX_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB

FORMAT_TO_EXTENSION = {
    "JPEG": ".jpg",
    "PNG": ".png",
}


def validate_uploaded_image(file: UploadFile, image_bytes: bytes) -> str:
    """
    Validates an uploaded image file. Raises HTTPException on any failure.
    Returns the safe file extension to use when saving, derived from the
    actual verified image content — never from the client-supplied filename.
    """
    # 1. Content-type check (client-declared, spoofable, but cheap first filter)
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported file type. Please upload a JPG or PNG image."
        )

    # 2. Size check
    if len(image_bytes) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty."
        )
    if len(image_bytes) > MAX_UPLOAD_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File is too large. Maximum allowed size is 5 MB."
        )

    # 3. Real content verification — this is the authoritative check.
    # Client-supplied content_type and filename are both spoofable; this is not.
    try:
        img = Image.open(io.BytesIO(image_bytes))
        img.verify()  # checks the file is a valid, non-corrupted image
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is not a valid or is a corrupted image."
        )

    # img.verify() invalidates the image object for further use, so re-open
    # to safely read the format after verification succeeds.
    try:
        img = Image.open(io.BytesIO(image_bytes))
        detected_format = img.format
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is not a valid or is a corrupted image."
        )

    if detected_format not in ALLOWED_PIL_FORMATS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported image format. Please upload a JPG or PNG image."
        )

    return FORMAT_TO_EXTENSION[detected_format]


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

    # Validate the upload BEFORE any processing — type, size, and real image content
    file_extension = validate_uploaded_image(file, image_bytes)

    # Check photo quality (blur/brightness/etc.) after confirming it's a real, valid image
    quality = check_photo_quality(image_bytes)
    if not quality["passed"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=quality["issues"]
        )

    # Save the photo to disk — filename extension now comes from verified image content,
    # never from the client-supplied filename
    unique_filename = f"{current_user.id}_{uuid.uuid4().hex}{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)
    with open(file_path, "wb") as f:
        f.write(image_bytes)
    photo_url = f"/uploaded_scans/{unique_filename}"

    # Run CV analysis
    cv_scores = analyze_skin(
    image_bytes,
    photo_confidence=quality["confidence"]
)

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
        photo_url=photo_url,
        acne_score=cv_scores["acne_score"],
        redness_score=cv_scores["redness_score"],
        wrinkles_score=cv_scores["wrinkles_score"],
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
        "weather": weather,
        "photo_url": photo_url
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

@router.get("/compare")
def compare_scans(
    scan_id_1: int = Query(...),
    scan_id_2: int = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if scan_id_1 == scan_id_2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please select two different scans to compare."
        )

    scans = db.query(Scan).filter(
        Scan.id.in_([scan_id_1, scan_id_2]),
        Scan.user_id == current_user.id
    ).all()

    if len(scans) != 2:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="One or both scans were not found for this user."
        )

    # Order by date regardless of which scan_id was passed first
    scans_sorted = sorted(scans, key=lambda s: s.created_at)
    older_scan, newer_scan = scans_sorted[0], scans_sorted[1]

    comparisons = []
    improved_count = 0
    worsened_count = 0
    unchanged_count = 0

    for field in CONDITION_FIELDS:
        older_value = getattr(older_scan, field)
        newer_value = getattr(newer_scan, field)
        condition_name = field.replace("_score", "")

        if older_value is None or newer_value is None:
            comparisons.append({
                "condition": condition_name,
                "older_score": older_value,
                "newer_score": newer_value,
                "delta": None,
                "status": "no_data"
            })
            continue

        delta = newer_value - older_value  # negative delta = improvement (severity dropped)

        if delta <= -COMPARISON_THRESHOLD:
            status_label = "improved"
            improved_count += 1
        elif delta >= COMPARISON_THRESHOLD:
            status_label = "worsened"
            worsened_count += 1
        else:
            status_label = "no_significant_change"
            unchanged_count += 1

        comparisons.append({
            "condition": condition_name,
            "older_score": round(older_value, 4),
            "newer_score": round(newer_value, 4),
            "delta": round(delta, 4),
            "status": status_label
        })

    return {
        "older_scan": {
            "id": older_scan.id,
            "created_at": older_scan.created_at,
            "photo_url": older_scan.photo_url
        },
        "newer_scan": {
            "id": newer_scan.id,
            "created_at": newer_scan.created_at,
            "photo_url": newer_scan.photo_url
        },
        "comparisons": comparisons,
        "summary": {
            "improved": improved_count,
            "worsened": worsened_count,
            "no_significant_change": unchanged_count,
            "threshold_used": COMPARISON_THRESHOLD
        }
    }
    