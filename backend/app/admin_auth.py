"""Доступ к /api/admin — только пользователи из ADMIN_USER_IDS."""

from fastapi import Depends, HTTPException

from .auth import get_current_user
from .config import config
from .models import User


def is_admin_user(user: User) -> bool:
    if not config.ADMIN_USER_IDS:
        return False
    return int(user.id) in config.ADMIN_USER_IDS


def require_admin_user(current_user: User = Depends(get_current_user)) -> User:
    if not is_admin_user(current_user):
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user
