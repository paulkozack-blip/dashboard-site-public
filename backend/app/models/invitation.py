# backend/app/models/invitation.py
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
# from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class Invitation(Base):
    __tablename__ = "invitations"

    id = Column(Integer, primary_key=True, index=True)
    invite_code = Column(String(32), unique=True, index=True, nullable=False)
    username_for = Column(String(50), nullable=True)  # Для кого создан инвайт (опционально)
    invited_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    is_used = Column(Boolean, default=False, nullable=False)
    used_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    used_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

