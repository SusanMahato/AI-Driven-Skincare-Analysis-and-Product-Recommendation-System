from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.config import settings
from app.services.auth_service import create_access_token, get_user_by_email
from app.models.user import User
import httpx
import secrets

router = APIRouter(prefix="/auth", tags=["OAuth"])

GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo"
REDIRECT_URI = f"{settings.BACKEND_URL}/auth/google/callback"

@router.get("/google")
def google_login():
    params = {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "redirect_uri": REDIRECT_URI,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
    }
    query = "&".join(f"{k}={v}" for k, v in params.items())
    return RedirectResponse(f"{GOOGLE_AUTH_URL}?{query}")

@router.get("/google/callback")
async def google_callback(code: str = None, error: str = None, db: Session = Depends(get_db)):
    if error or not code:
        return RedirectResponse(f"{settings.FRONTEND_URL}/login")

    async with httpx.AsyncClient() as client:
        token_response = await client.post(GOOGLE_TOKEN_URL, data={
            "client_id": settings.GOOGLE_CLIENT_ID,
            "client_secret": settings.GOOGLE_CLIENT_SECRET,
            "code": code,
            "grant_type": "authorization_code",
            "redirect_uri": REDIRECT_URI,
        })
        token_data = token_response.json()
        access_token = token_data.get("access_token")

        if not access_token:
            return RedirectResponse(f"{settings.FRONTEND_URL}/login")

        user_response = await client.get(
            GOOGLE_USERINFO_URL,
            headers={"Authorization": f"Bearer {access_token}"}
        )
        user_info = user_response.json()

    email = user_info.get("email")
    full_name = user_info.get("name")
    google_id = user_info.get("id")

    if not email:
        return RedirectResponse(f"{settings.FRONTEND_URL}/login")

    user = get_user_by_email(db, email)
    if not user:
        user = User(
            full_name=full_name or email.split("@")[0],
            email=email,
            hashed_password=None,
            is_verified=True,
            oauth_provider="google",
            oauth_id=google_id
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    jwt_token = create_access_token(data={"sub": user.email})

    from app.services.quiz_service import get_skin_profile
    skin_profile = get_skin_profile(db, user.id)

    if skin_profile:
        redirect_to = "dashboard"
    else:
        redirect_to = "quiz"

    return RedirectResponse(
        f"{settings.FRONTEND_URL}/auth/callback?token={jwt_token}&redirect={redirect_to}"
    )