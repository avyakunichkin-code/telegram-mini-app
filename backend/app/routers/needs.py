from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..database import get_db
from ..game.time import get_active_game_profile
from ..needs.guide_content import CRITICAL, GUIDE_TITLE, MAINTENANCE, SECTIONS
from ..schemas import NeedsGuideResponse, NeedsGuideSection

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
        title=GUIDE_TITLE,
        sections=[NeedsGuideSection(**block) for block in SECTIONS],
        maintenance=list(MAINTENANCE),
        critical=list(CRITICAL),
    )

