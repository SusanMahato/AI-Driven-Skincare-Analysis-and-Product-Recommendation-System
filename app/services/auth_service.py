from sqlalchemy.orm import Session
from app.models.user import User
from app.schemas.auth import UserRegister
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from app.core.config import settings
from app.services.email_service import send_verification_email
import secrets
import random

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_user_by_email(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()

def create_user(db: Session, user_data: UserRegister):
    hashed = hash_password(user_data.password)
    verification_token = secrets.token_urlsafe(32)
    
    new_user = User(
        full_name=user_data.full_name,
        email=user_data.email,
        hashed_password=hashed,
        verification_token=verification_token,
        is_verified=False
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    try:
        send_verification_email(new_user.email, new_user.full_name, verification_token)
        print(f"Verification email sent to {new_user.email}")
    except Exception as e:
        print(f"Email sending failed: {e}")
    
    return new_user

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def verify_email_token(db: Session, token: str):
    user = db.query(User).filter(User.verification_token == token).first()
    if not user:
        return None
    user.is_verified = True
    user.verification_token = None
    db.commit()
    db.refresh(user)
    return user

def generate_otp() -> str:
    return str(random.randint(100000, 999999))

def create_password_reset_otp(db: Session, email: str):
    user = get_user_by_email(db, email)
    if not user:
        return None
    
    otp = generate_otp()
    expires = datetime.utcnow() + timedelta(minutes=10)
    
    user.reset_otp = otp
    user.reset_otp_expires = expires
    db.commit()
    
    try:
        from app.services.email_service import send_password_reset_email
        send_password_reset_email(user.email, user.full_name, otp)
    except Exception as e:
        print(f"OTP email failed: {e}")
    
    return otp

def reset_password_with_otp(db: Session, email: str, otp: str, new_password: str):
    user = get_user_by_email(db, email)
    if not user:
        return False
    
    if user.reset_otp != otp:
        return False
    
    if user.reset_otp_expires.replace(tzinfo=None) < datetime.utcnow():
        return False
    
    user.hashed_password = hash_password(new_password)
    user.reset_otp = None
    user.reset_otp_expires = None
    db.commit()
    return True