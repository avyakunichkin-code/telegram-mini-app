from fastapi import HTTPException
from sqlalchemy.orm import Session

from ...models import GameProfile
from ...schemas import PeriodSummaryResponse
from ...timeutil import utc_now_naive
from .snapshot import get_current_period_snapshot


def complete_period(db: Session, profile: GameProfile) -> PeriodSummaryResponse:
    """
    Завершает текущий период (legacy endpoint /complete-period).
    Фиксирует итоги и переносит состояние в следующий период.

    Важно: это НЕ основной end-of-period пайплайн (см. game_time/time/next + game_period).
    """
    snapshot = get_current_period_snapshot(db, profile)

    if snapshot.is_completed == 1:
        raise HTTPException(status_code=400, detail="Period already completed")

    # Рассчитываем чистые сбережения
    net_savings = snapshot.safety_fund_contribution

    # Отмечаем период как завершённый
    snapshot.is_completed = 1
    snapshot.completed_at = utc_now_naive()
    snapshot.net_savings = net_savings

    # Инкрементируем период
    profile.period_index += 1
    profile.period_anchor_at = utc_now_naive()

    db.commit()

    return PeriodSummaryResponse(
        period_index=snapshot.period_index,
        salary_claimed=snapshot.salary_claimed == 1,
        salary_amount=snapshot.salary_amount,
        safety_fund_contribution=snapshot.safety_fund_contribution,
        safety_fund_total=snapshot.safety_fund_total,
        net_savings=net_savings,
        required_actions_completed=True,
    )

