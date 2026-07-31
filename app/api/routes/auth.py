import logging
from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr, field_validator
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.limiter import limiter
from app.schemas.auth import Token, UserRegister, UserResponse, validate_password_strength
from app.services.auth_service import (
    create_access_token,
    create_password_reset_otp,
    create_user,
    get_user_by_email,
    reset_password_with_otp,
    verify_email_token,
    verify_password,
)

logger = logging.getLogger("skincare_api")

router = APIRouter(prefix="/auth", tags=["Authentication"])


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    email: EmailStr
    otp: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def validate_new_password(cls, v):
        return validate_password_strength(v)


@router.post("/register", response_model=UserResponse)
def register(user_data: UserRegister, db: Session = Depends(get_db)):
    existing_user = get_user_by_email(db, user_data.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    new_user = create_user(db, user_data)
    return new_user


@router.post("/login", response_model=Token)
@limiter.limit("5/minute")
async def login(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    user = get_user_by_email(db, form_data.username)
    if not user:
        logger.warning(f"Failed login attempt for unknown email: {form_data.username}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    if not verify_password(form_data.password, user.hashed_password):
        logger.warning(f"Failed login attempt (wrong password) for user_id={user.id}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    if not user.is_verified:
        logger.info(f"Login blocked (unverified email) for user_id={user.id}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Please verify your email before logging in. Check your inbox for the verification link."
        )

    logger.info(f"Successful login for user_id={user.id}")
    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/verify-email")
def verify_email(token: str, db: Session = Depends(get_db)):
    user = verify_email_token(db, token)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification token"
        )
    return {"message": "Email verified successfully. You can now login."}


@router.post("/forgot-password")
@limiter.limit("3/hour")
def forgot_password(
    request: Request,
    payload: ForgotPasswordRequest,
    db: Session = Depends(get_db)
):
    create_password_reset_otp(db, payload.email)
    return {"message": "If this email exists, an OTP has been sent."}


@router.post("/reset-password")
@limiter.limit("5/10minutes")
def reset_password(
    request: Request,
    payload: ResetPasswordRequest,
    db: Session = Depends(get_db)
):
    success = reset_password_with_otp(db, payload.email, payload.otp, payload.new_password)
    if not success:
        logger.warning(f"Failed password reset attempt for email: {payload.email}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired OTP"
        )

    logger.info(f"Successful password reset for email: {payload.email}")
    return {"message": "Password reset successfully. You can now login."}
