from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..achievement_engine import process_achievement_unlocks, serialize_achievements_for_profile
from ..achievement_seeds import ensure_achievement_catalog
from ..auth import get_current_user
from ..database import get_db
from ..game_time import get_active_game_profile, sync_time
from ..schemas import AchievementsOverviewResponse

router = APIRouter(prefix="/api/game/achievements", tags=["achievements"])


@router.get("", response_model=AchievementsOverviewResponse)
async def get_achievements_overview(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Цепочки достижений и прогресс по активной партии; перед ответом — проверка новых unlock."""
    profile = get_active_game_profile(db, current_user.id)
    sync_time(profile)

    ensure_achievement_catalog(db)
    newly_unlocked = process_achievement_unlocks(db, profile)
    db.commit()
    db.refresh(profile)

    chains = serialize_achievements_for_profile(db, profile.id)
    return AchievementsOverviewResponse(
        period_index=int(profile.period_index),
        character_level=max(1, int(profile.level or 1)),
        character_xp=max(0, int(profile.xp or 0)),
        chains=chains,
        newly_unlocked=newly_unlocked,
    )
