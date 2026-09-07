from __future__ import annotations

import json
import time

from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ...game.period import process_period_end
from ...game.time import (
    get_active_game_profile,
    get_seconds_until_next,
    set_period_duration,
    set_time_state,
    sync_time,
)
from ...models import ApiIdempotencyRecord, GameProfile
from ...events.mandatory import pending_mandatory_blocking_event_titles
from ...schemas import (
    AchievementUnlockEvent,
    PeriodCloseBreakdownItem,
    PeriodCloseHighlight,
    PeriodCloseSummary,
    TimeConfigUpdate,
    TimeStatusResponse,
)


def _breakdown_item_from_raw(item: dict) -> PeriodCloseBreakdownItem | None:
    if not isinstance(item, dict):
        return None
    item_type = str(item.get("type") or "other")
    title = str(item.get("title") or "").strip()
    if not title:
        return None
    amount = round(float(item.get("amount") or 0), 2)
    paid = round(float(item.get("paid") or 0), 2) if item.get("paid") is not None else None
    unpaid = round(float(item.get("unpaid") or 0), 2) if item.get("unpaid") is not None else None
    due = round(float(item.get("due") or 0), 2) if item.get("due") is not None else None
    if item_type == "liability":
        amount = paid if paid is not None else amount
    return PeriodCloseBreakdownItem(
        type=item_type,
        title=title,
        amount=amount,
        category_key=item.get("category_key"),
        paid=paid,
        unpaid=unpaid,
        due=due,
    )


def period_close_summary(period_result: dict) -> PeriodCloseSummary:
    breakdown = [
        row
        for item in (period_result.get("breakdown") or [])
        if (row := _breakdown_item_from_raw(item)) is not None
    ]
    achievement_unlocks = [
        AchievementUnlockEvent(**item)
        for item in (period_result.get("achievement_unlocks") or [])
        if isinstance(item, dict)
    ]
    period_highlights = [
        PeriodCloseHighlight(**item)
        for item in (period_result.get("period_highlights") or [])
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
        overdue_added=round(float(period_result.get("overdue_added") or 0), 2),
        breakdown=breakdown,
        period_highlights=period_highlights,
        achievement_unlocks=achievement_unlocks,
        events_spawn_failed=bool(period_result.get("events_spawn_failed")),
    )


def _time_status_response(
    profile: GameProfile,
    *,
    period_close=None,
    game_over: bool = False,
    defeat_reason: str | None = None,
) -> TimeStatusResponse:
    return TimeStatusResponse(
        time_state=profile.time_state,
        period_index=profile.period_index,
        period_duration_seconds=profile.period_duration_seconds,
        seconds_until_next_period=get_seconds_until_next(profile),
        period_close=period_close,
        game_over=game_over,
        defeat_reason=defeat_reason,
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


TIME_NEXT_ROUTE_KEY = "game.time.next"


def close_idempotency_key(profile_id: int, period_index: int) -> str:
    return f"{int(profile_id)}:{int(period_index)}:close"


def _lock_active_profile(db: Session, user_id: int) -> GameProfile:
    query = db.query(GameProfile).filter(
        GameProfile.user_id == user_id,
        GameProfile.is_active == 1,
        GameProfile.is_archived == 0,
    )
    if db.get_bind().dialect.name != "sqlite":
        query = query.with_for_update()
    profile = query.first()
    if not profile:
        raise HTTPException(status_code=404, detail="Активный профиль не найден")
    return profile


def _load_stored_close(
    db: Session, user_id: int, key: str
) -> TimeStatusResponse | None:
    record = (
        db.query(ApiIdempotencyRecord)
        .filter(
            ApiIdempotencyRecord.user_id == user_id,
            ApiIdempotencyRecord.route_key == TIME_NEXT_ROUTE_KEY,
            ApiIdempotencyRecord.idempotency_key == key,
        )
        .first()
    )
    if not record or not record.response_json or record.response_json == "{}":
        return None
    try:
        data = json.loads(record.response_json)
    except json.JSONDecodeError:
        return None
    if not data:
        return None
    return TimeStatusResponse.model_validate(data)


def _store_close_response(
    db: Session, user_id: int, key: str, response: TimeStatusResponse
) -> None:
    payload = json.dumps(response.model_dump(mode="json"), ensure_ascii=False)
    record = (
        db.query(ApiIdempotencyRecord)
        .filter(
            ApiIdempotencyRecord.user_id == user_id,
            ApiIdempotencyRecord.route_key == TIME_NEXT_ROUTE_KEY,
            ApiIdempotencyRecord.idempotency_key == key,
        )
        .first()
    )
    if record:
        record.status_code = 200
        record.response_json = payload
    else:
        db.add(
            ApiIdempotencyRecord(
                user_id=user_id,
                route_key=TIME_NEXT_ROUTE_KEY,
                idempotency_key=key,
                status_code=200,
                response_json=payload,
            )
        )
    db.commit()


def _replay_or_current(db: Session, user_id: int, key: str) -> TimeStatusResponse:
    stored = _load_stored_close(db, user_id, key)
    if stored:
        return stored
    for _ in range(20):
        time.sleep(0.05)
        db.rollback()
        stored = _load_stored_close(db, user_id, key)
        if stored:
            return stored
    profile = _lock_active_profile(db, user_id)
    return _time_status_response(profile)


def _finish_close_response(
    db: Session, profile: GameProfile, period_result: dict
) -> TimeStatusResponse:
    if period_result["game_over"]:
        reason = str(period_result.get("defeat_reason") or "") or None
        return _time_status_response(
            profile,
            period_close=period_close_summary(period_result),
            game_over=True,
            defeat_reason=reason,
        )

    sync_time(profile)
    set_time_state(profile, "pause")
    db.commit()
    db.refresh(profile)
    return _time_status_response(
        profile,
        period_close=period_close_summary(period_result),
    )


def close_open_period(
    db: Session, user_id: int, *, intended_period: int
) -> TimeStatusResponse:
    """
    Закрыть конкретный открытый период.

    Повтор того же intended_period возвращает сохранённый ответ (ключ profile+period).
    Если профиль уже ушёл дальше — replay, без второго process_period_end.
    """
    profile = _lock_active_profile(db, user_id)
    key = close_idempotency_key(profile.id, intended_period)

    if int(profile.period_index) != intended_period:
        db.rollback()
        return _replay_or_current(db, user_id, key)

    stored = _load_stored_close(db, user_id, key)
    if stored:
        return stored

    blocking = pending_mandatory_blocking_event_titles(
        db, profile.id, intended_period
    )
    if blocking:
        titles = "», «".join(blocking[:3])
        raise HTTPException(
            status_code=400,
            detail=f"Сначала примите решение по обязательным событиям: «{titles}».",
        )

    claimed = False
    try:
        with db.begin_nested():
            db.add(
                ApiIdempotencyRecord(
                    user_id=user_id,
                    route_key=TIME_NEXT_ROUTE_KEY,
                    idempotency_key=key,
                    status_code=200,
                    response_json="{}",
                )
            )
            db.flush()
        claimed = True
    except IntegrityError:
        db.rollback()
        return _replay_or_current(db, user_id, key)

    try:
        period_result = process_period_end(db, profile)
        response = _finish_close_response(db, profile, period_result)
        _store_close_response(db, user_id, key, response)
        return response
    except Exception:
        if claimed:
            leftover = (
                db.query(ApiIdempotencyRecord)
                .filter(
                    ApiIdempotencyRecord.user_id == user_id,
                    ApiIdempotencyRecord.route_key == TIME_NEXT_ROUTE_KEY,
                    ApiIdempotencyRecord.idempotency_key == key,
                )
                .first()
            )
            if leftover and leftover.response_json == "{}":
                db.delete(leftover)
                db.commit()
        raise


def go_to_next_period(db: Session, user_id: int) -> TimeStatusResponse:
    profile = get_active_game_profile(db, user_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Активный профиль не найден")
    return close_open_period(db, user_id, intended_period=int(profile.period_index))


def update_time_config(db: Session, user_id: int, payload: TimeConfigUpdate) -> TimeStatusResponse:
    profile = get_active_game_profile(db, user_id)
    set_period_duration(profile, payload.period_duration_seconds)
    db.commit()
    db.refresh(profile)
    return _time_status_response(profile)
