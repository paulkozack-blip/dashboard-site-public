# backend/app/schemas/user.py
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class UserSchema(BaseModel):
    id: int
    username: str
    role: str
    is_active: bool
    is_verified: bool
    created_at: datetime
    email: Optional[str] = None

    class Config:
        # orm_mode = True  
        from_attributes = True
        

class UserCreate(BaseModel):
    username: str
    password: str
    invite_code: Optional[str] = None
    email: Optional[str] = None

class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[str] = None

class UserInDB(BaseModel):
    id: int
    username: str
    role: str
    is_active: bool
    is_verified: bool
    created_at: datetime
    email: Optional[str] = None

    class Config:
        # orm_mode = True  
        from_attributes = True

class ChangePassword(BaseModel):
    old_password: str
    new_password: str

class UsersResponse(BaseModel):
    users: List[UserSchema]
    total: int