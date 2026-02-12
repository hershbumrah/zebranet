"""Authentication schemas."""

from typing import Optional

from pydantic import BaseModel, EmailStr


class UserBase(BaseModel):
    email: EmailStr
    role: str
    profile_image_url: Optional[str] = None


class UserResponse(UserBase):
    id: int

    class Config:
        from_attributes = True


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    role: str
    name: Optional[str] = None
    region: Optional[str] = None
    primary_region: Optional[str] = None
    home_location: Optional[str] = None
    cert_level: Optional[str] = None
    profile_image_url: Optional[str] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class AuthResponse(Token):
    user: UserResponse
