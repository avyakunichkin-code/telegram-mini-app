from fastapi import HTTPException
from sqlalchemy.orm import Session

from ...game.period import process_period_end
from ...game.time import (
    get_active_game_profile,
    get_seconds_until_next,
    set_period_duration,
    set_time_state,
    sync_time,
)
from ...models import GameProfile
from ...events.mandatory import pending_mandatory_blocking_event_titles
from ...schemas import (
    AchievementUnlockEvent,
    PeriodCloseBreakdownItem,
    PeriodCloseSummary,
    TimeConfigUpdate,
    TimeStatusResponse,
)


def period_close_summary(period_result: dict) -> PeriodCloseSummary:
    breakdown = [
        PeriodCloseBreakdownItem(
            type=str(item.get("type") or "other"),
            title=str(item.get("title") or ""),
            amount=round(float(item.get("amount") or 0), 2),
            category_key=item.get("category_key"),
        )
        for item in (period_result.get("breakdown") or [])
        if isinstance(item, dict)
    ]
    achievement_unlocks = [
        AchievementUnlockEvent(**item)
        for item in (period_result.get("achievement_unlocks") or [])
        if isinstance(item, dict)
    ]
    return PeriodCloseSummary(
        closed_period_index=int(period_result.get("closed_period_index") or 0),
        cash_delta=round(float(period_result.get("cash_delta") or 0), 2),
        income_delta=round(float(period_result.get("income_delta") or 0), 2),
        expense_delta=round(float(period_result.get("expense_delta") or 0), 2),
        safety_fund_delta=round(float(period_result.get("safety_fund_delta") or 0), 2),
        invest_capital_delta=round(float(period_result.get("invest_capital_delta") or 0), 2),
        debt_delta=round(float(period_result.get("debt_delta") or 0), 2),
        total_spent=round(float(period_result.get("total_spent") or 0), 2),
        new_balance=round(float(period_result.get("new_balance") or 0), 2),
        breakdown=breakdown,
        achievement_unlocks=achievement_unlocks,
    )


def _time_status_response(profile: GameProfile, *, period_close=None) -> TimeStatusResponse:
    return TimeStatusResponse(
        time_state=profile.time_state,
        period_index=profile.period_index,
        period_duration_seconds=profile.period_duration_seconds,
        seconds_until_next_period=get_seconds_until_next(profile),
        period_close=period_close,
    )


def get_time_status(db: Session, user_id: int) -> TimeStatusResponse:
    profile = get_active_game_profile(db, user_id)
    sync_time(profile)
    db.commit()
    db.refresh(profile)
    return _time_status_response(profile)


def set_play_mode(db: Session, user_id: int) -> TimeStatusResponse:
    profile = get_active_game_profile(db, user_id)
    set_time_state(profile, "play")
    db.commit()
    db.refresh(profile)
    return _time_status_response(profile)


def set_pause_mode(db: Session, user_id: int) -> TimeStatusResponse:
    profile = get_active_game_profile(db, user_id)
    sync_time(profile)
    set_time_state(profile, "pause")
    db.commit()
    db.refresh(profile)
    return _time_status_response(profile)


def go_to_next_period(db: Session, user_id: int) -> TimeStatusResponse:
    profile = get_active_game_profile(db, user_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Активный профиль не найден")

    blocking = pending_mandatory_blocking_event_titles(
        db, profile.id, int(profile.period_index)
    )
    if blocking:
        titles = "», «".join(blocking[:3])
        raise HTTPException(
            status_code=400,
            detail=f"Сначала примите решение по обязательным событиям: «{titles}».",
        )

    period_result = process_period_end(db, profile)

    if period_result["game_over"]:
        reason = str(period_result.get("defeat_reason") or "")
        if reason == "needs_depletion":
            msg = "Игра окончена. Поражение: потребности были на нуле 3 месяца подряд. Начните новую игру."
        elif reason == "cash_negative_streak":
            msg = "Игра окончена. Вы трижды подряд имели отрицательный баланс. Начните новую игру."
        else:
            msg = "Игра окончена. Начните новую игру."
        raise HTTPException(status_code=400, detail=msg)

    sync_time(profile)
    set_time_state(profile, "pause")
    db.commit()
    db.refresh(profile)

    return _time_status_response(
        profile,
        period_close=period_close_summary(period_result),
    )


def update_time_config(db: Session, user_id: int, payload: TimeConfigUpdate) -> TimeStatusResponse:
    profile = get_active_game_profile(db, user_id)
    set_period_duration(profile, payload.period_duration_seconds)
    db.commit()
    db.refresh(profile)
    return _time_status_response(profile)
