# backend/app/schemas/auth.py
from dataclasses import dataclass
from typing import Optional
from datetime import datetime

@dataclass
class LoginRequest:
    username: str
    password: str

@dataclass
class RegisterRequest:
    username: str
    password: str
    invite_code: str

@dataclass
class TokenResponse:
    access_token: str
    token_type: str = "bearer"

@dataclass
class UserInfo:
    id: int
    username: str
    role: str
    is_active: bool
    created_at: Optional[datetime] = None