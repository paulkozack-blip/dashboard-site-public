# backend/app/api/routes/invites.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
from typing import Dict, Any

from app.database import get_db
from app.models.invitation import Invitation
from app.models.user import User
from app.api.deps import get_current_user
from app.core.security import generate_invite_code

router = APIRouter()

@router.post("/create")
def create_invite(
    invite_data: Dict[str, Any], 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Создание нового приглашения (только для авторизованных пользователей).
    
    Пример:
    - POST /invites/create {"username_for": "optional_user"}
    Ответ: Данные приглашения с кодом
    """
    username_for = invite_data.get("username_for")
    expires_in_days = invite_data.get("expires_in_days", 7)
    
    invite_code = generate_invite_code()
    expires_at = datetime.now(timezone.utc) + timedelta(days=expires_in_days)
    
    new_invite = Invitation(
        username_for=username_for,
        invite_code=invite_code,
        invited_by=current_user.id,
        expires_at=expires_at
    )
    
    db.add(new_invite)
    db.commit()
    db.refresh(new_invite)
    
    return {
        "id": new_invite.id,
        "invite_code": new_invite.invite_code,
        "username_for": new_invite.username_for,
        "is_used": new_invite.is_used,
        "expires_at": new_invite.expires_at.isoformat(),
        "created_at": new_invite.created_at.isoformat()
    }

@router.get("/my")
def get_my_invites(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    only_active: bool = False
) -> Dict[str, Any]:
    """
    Получение списка приглашений текущего пользователя
    """
    query = db.query(Invitation).filter(Invitation.invited_by == current_user.id)
    
    if only_active:
        query = query.filter(Invitation.is_used == False)
    
    invites = query.order_by(Invitation.created_at.desc()).all()
    
    return {
        "invites": [
            {
                "id": invite.id,
                "invite_code": invite.invite_code,
                "username_for": invite.username_for,
                "is_used": invite.is_used,
                "expires_at": invite.expires_at.isoformat(),
                "created_at": invite.created_at.isoformat()
            }
            for invite in invites
        ],
        "total": len(invites)
    }

@router.get("/validate/{invite_code}")
def validate_invite(invite_code: str, db: Session = Depends(get_db)) -> Dict[str, bool]:
    """
    Проверка кода приглашения.
    
    Пример:
    - GET /invites/validate/abc123
    Ответ: {"valid": true} или ошибка 404
    """
    invite = db.query(Invitation).filter(Invitation.invite_code == invite_code).first()
    
    if not invite:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Приглашение не найдено"
        )
    
    # проверка SQLAlchemy Column
    is_used = getattr(invite, 'is_used', False)
    expires_at = getattr(invite, 'expires_at', None)
    
    if is_used or (expires_at and expires_at < datetime.now(timezone.utc)):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Недействительное или просроченное приглашение"
        )
    
    return {"valid": True}

@router.delete("/{invite_id}")
def delete_invite(
    invite_id: int, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
) -> Dict[str, str]:
    """
    Отзыв приглашения.
    
    Пример:
    - DELETE /invites/1 (с заголовком Authorization)
    Ответ: {"msg": "Приглашение отозвано"}
    """
    invite = db.query(Invitation).filter(
        Invitation.id == invite_id, 
        Invitation.invited_by == current_user.id
    ).first()
    
    if not invite:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Приглашение не найдено"
        )
    
    db.delete(invite)
    db.commit()
    
    return {"msg": "Приглашение отозвано"}