from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api import deps
from app.models.user import User, UserRole  # Импорт UserRole для Enum
from app.schemas.user import UsersResponse, UserSchema

router = APIRouter()

@router.get("/users", response_model=UsersResponse)
async def get_all_users(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_admin_user)
):
    """
    Get all users (admin only)
    """
    users = db.query(User).all()
    return UsersResponse(
        users=[
            UserSchema(
                id=user.id,
                username=user.username,
                role=str(user.role),  
                is_active=user.is_active,
                is_verified=user.is_verified,
                created_at=user.created_at
            ) for user in users  # type: ignore
        ],
        total=len(users)
    )

@router.get("/users/{user_id}", response_model=UserSchema)
async def get_user(
    user_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_admin_user)
):
    """
    Get user by ID (admin only)
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return UserSchema(
        id=user.id,
        username=user.username,
        role=str(user.role),  
        is_active=user.is_active,
        is_verified=user.is_verified,
        created_at=user.created_at
    )  # type: ignore

@router.delete("/users/{user_id}")
async def delete_user(
    user_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_admin_user)
):
    """
    Delete user (admin only)
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete yourself"
        )
    
    db.delete(user)
    db.commit()
    
    return {"message": f"User {user.username} deleted successfully"}

@router.post("/users/{user_id}/activate")
async def toggle_user_active(
    user_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_admin_user)
):
    """
    Activate/deactivate user (admin only)
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    user.is_active = not bool(user.is_active)  # type: ignore
    db.commit()
    db.refresh(user)
    
    status_text = "activated" if bool(user.is_active) else "deactivated"  # type: ignore
    return {"message": f"User {user.username} {status_text}"}

@router.post("/users/{user_id}/make-admin")
async def make_user_admin(
    user_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_admin_user)
):
    """
    Make user admin (admin only)
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    user.role = UserRole.ADMIN  
    db.commit()
    db.refresh(user)
    
    return {"message": f"User {user.username} promoted to admin"}

@router.get("/stats")
async def get_system_stats(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_admin_user)
):
    """
    Get system statistics (admin only)
    """
    total_users = db.query(User).count()
    active_users = db.query(User).filter(User.is_active == True).count()
    admin_users = db.query(User).filter(User.role == UserRole.ADMIN).count()
    
    return {
        "total_users": total_users,
        "active_users": active_users,
        "admin_users": admin_users
    }
