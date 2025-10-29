# backend/app/api/routes/users.py
from fastapi import APIRouter, Depends
from typing import Dict, Any
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter()

@router.get("/profile")
async def get_profile(current_user: User = Depends(get_current_user)) -> Dict[str, Any]:
    """Получение профиля пользователя"""
    return {
        "id": current_user.id,
        "username": current_user.username,
        "role": current_user.role.value,
        "is_active": current_user.is_active,
        "created_at": (
            created_at.isoformat() 
            if (created_at := getattr(current_user, 'created_at', None)) is not None 
            else None
        )
    }