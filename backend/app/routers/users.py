from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import GameProfile
from ..schemas import UserResponse
from ..auth import get_current_user

router = APIRouter(prefix="/api/user", tags=["users"])


@router.get("/me", response_model=UserResponse)
async def get_me(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Профиль текущего пользователя (аккаунт TMA)."""
    game_profiles_count = (
        db.query(GameProfile).filter(GameProfile.user_id == current_user.id).count()
    )

    return UserResponse(
        id=current_user.id,
        username=current_user.username,
        full_name=current_user.full_name,
        email=current_user.email,
        game_profiles_count=game_profiles_count,
        created_at=current_user.created_at,
    )
