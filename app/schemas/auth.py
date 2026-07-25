from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional
from email_validator import validate_email, EmailNotValidError

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
        