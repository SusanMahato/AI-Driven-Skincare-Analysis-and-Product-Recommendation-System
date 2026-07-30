from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional
from email_validator import validate_email, EmailNotValidError


def validate_password_strength(password: str) -> str:
    """
    Shared password validation logic, used by both registration and
    password reset so the two flows can never drift out of sync.
    """
    if len(password) < 8:
        raise ValueError('Password must be at least 8 characters long.')
    if len(password) > 72:
        raise ValueError('Password must be no more than 72 characters long.')
    return password


class UserRegister(BaseModel):
    full_name: str
    email: EmailStr
    password: str

    @field_validator('email')
    @classmethod
    def validate_email_deliverable(cls, v):
        try:
            validate_email(v, check_deliverability=True)
        except EmailNotValidError:
            raise ValueError('Email domain does not appear to accept mail. Please use a valid email address.')
        return v

    @field_validator('full_name')
    @classmethod
    def validate_full_name(cls, v):
        v = v.strip()
        if len(v) < 1:
            raise ValueError('Full name cannot be empty.')
        if len(v) > 100:
            raise ValueError('Full name is too long (max 100 characters).')
        return v

    @field_validator('password')
    @classmethod
    def validate_password(cls, v):
        return validate_password_strength(v)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    email: Optional[str] = None


class UserResponse(BaseModel):
    id: int
    full_name: str
    email: str
    is_verified: bool

    class Config:
        from_attributes = True
        