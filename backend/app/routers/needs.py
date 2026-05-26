from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..database import get_db
from ..game_time import get_active_game_profile
from ..needs_guide_content import CRITICAL, MAINTENANCE
from ..schemas import NeedsGuideResponse

router = APIRouter(prefix="/api/game/needs", tags=["needs"])


@router.get("/guide", response_model=NeedsGuideResponse)
async def get_needs_guide(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Справочник «Помощь»: как поддерживать баланс и что делать в критике."""
    # Фиксируем наличие профиля (в будущем можно делать вариации по consequence_profile).
    get_active_game_profile(db, current_user.id)
    return NeedsGuideResponse(
        maintenance=list(MAINTENANCE),
        critical=list(CRITICAL),
    )

