# app/schemas/invitation.py - Схемы для инвайтов
from dataclasses import dataclass
from typing import Optional
from datetime import datetime

@dataclass
class CreateInviteRequest:
    username_for: Optional[str] = None
    expires_in_days: int = 7

@dataclass
class InviteInfo:
    id: int
    invite_code: str
    username_for: Optional[str]
    is_used: bool
    expires_at: datetime
    created_at: datetime
