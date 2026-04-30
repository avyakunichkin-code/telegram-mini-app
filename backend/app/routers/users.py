from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Message
from app.schemas import UserResponse
from app.auth import get_current_user

router = APIRouter(prefix="/api/user", tags=["users"])


@router.get("/me", response_model=UserResponse)
async def get_me(
    current_user = Depends(get_current_user),  # ← требует авторизацию
    db: Session = Depends(get_db)
):
    """Получение профиля текущего пользователя — ТРЕБУЕТ авторизацию"""
    messages_count = db.query(Message).filter(Message.user_id == current_user.id).count()
    
    return UserResponse(
        id=current_user.id,
        username=current_user.username,
        full_name=current_user.full_name,
        email=current_user.email,
        messages_count=messages_count,
        created_at=current_user.created_at
    )