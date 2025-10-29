# backend/app/api/routes/auth.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from typing import Dict, Any, Union

from app.database import get_db
from app.models.user import User, UserRole
from app.models.invitation import Invitation
from app.schemas.auth import LoginRequest, RegisterRequest 
from app.core.security import verify_password, get_password_hash, create_access_token
from app.api.deps import get_current_user
from dacite import from_dict

router = APIRouter()

@router.post("/login", response_model=dict)
async def login(request: Dict[str, Any], db: Session = Depends(get_db)):
    """Авторизация пользователя"""
    try:
        login_data = from_dict(LoginRequest, request)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid request format")
    
    # Находим пользователя
    user = db.query(User).filter(User.username == login_data.username).first()
    if not user or not verify_password(login_data.password, str(user.password_hash)):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )
    
    if not bool(user.is_active):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User is not active",
        )
    
    # Создаем токен
    access_token = create_access_token(data={"sub": user.username})
    
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/register", response_model=dict)
async def register(request: Dict[str, Any], db: Session = Depends(get_db)):
    """Регистрация пользователя по инвайт-коду"""
    try:
        register_data = from_dict(RegisterRequest, request)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid request format")
    
    # Проверяем инвайт
    invite = db.query(Invitation).filter(
        Invitation.invite_code == register_data.invite_code,
        Invitation.is_used.is_(False),  # Исправление для Column[bool]
        Invitation.expires_at > datetime.now(timezone.utc)
    ).first()
    
    if not invite:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired invite code",
        )
    
    # Проверяем, что username свободен
    if db.query(User).filter(User.username == register_data.username).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered",
        )
    
    # Создаем пользователя
    user = User(
        username=register_data.username,
        password_hash=get_password_hash(register_data.password),
        role=UserRole.USER,
        is_active=True,
        is_verified=True
    )
    
    db.add(user)
    db.flush()  # Получаем ID пользователя
    
    # Помечаем инвайт как использованный
    # Используем update() для обновления значений
    db.query(Invitation).filter(Invitation.id == invite.id).update({
        'is_used': True,
        'used_by': user.id,
        'used_at': datetime.now(timezone.utc)
    })
    
    db.commit()
    
    # Создаем токен
    access_token = create_access_token(data={"sub": user.username})
    
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me")
async def get_current_user_info(current_user: User = Depends(get_current_user)) -> Dict[str, Union[int, str, bool, None]]:
    """Получение информации о текущем пользователе"""
    return {
        "id": current_user.id,  # type: ignore
        "username": current_user.username,  # type: ignore  
        "role": current_user.role.value,  # type: ignore
        "is_active": current_user.is_active,  # type: ignore
        "created_at": current_user.created_at.isoformat() if current_user.created_at else None  # type: ignore
    }