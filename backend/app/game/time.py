from typing import Tuple

from fastapi import HTTPException
from sqlalchemy.orm import Session

from ..models import GameProfile, Transaction
from ..finance.balance_utils import TRANSACTION_TYPES
from ..timeutil import utc_now_naive


def get_active_game_profile(db: Session, user_id: int) -> GameProfile:
    """Активная партия. Не создаёт новую, если у пользователя уже есть сохранения."""
    profile = (
        db.query(GameProfile)
        .filter(GameProfile.user_id == user_id, GameProfile.is_active == 1, GameProfile.is_archived == 0)
        .first()
    )
    if profile:
        return profile

    has_any = (
        db.query(GameProfile.id)
        .filter(GameProfile.user_id == user_id, GameProfile.is_archived == 0)
        .limit(1)
        .first()
    )
    if has_any:
        raise HTTPException(status_code=404, detail="Активный профиль не найден")

    fallback = GameProfile(user_id=user_id, name="Мой первый профиль", save_kind="game", is_active=1)
    db.add(fallback)
    db.commit()
    db.refresh(fallback)
    return fallback


def _infer_defeat_reason(db: Session, profile_id: int) -> str | None:
    row = (
        db.query(Transaction)
        .filter(
            Transaction.game_profile_id == profile_id,
            Transaction.type == TRANSACTION_TYPES["GAME_OVER"],
        )
        .order_by(Transaction.id.desc())
        .first()
    )
    if not row:
        return None
    desc = str(row.description or "").lower()
    if "потребност" in desc:
        return "needs_depletion"
    if "отрицательн" in desc or "баланс" in desc:
        return "cash_negative_streak"
    return "unknown"


def resolve_game_session(
    db: Session, user_id: int
) -> tuple[GameProfile, str, str | None, int | None]:
    """
  Возвращает (profile, session_status, defeat_reason, defeat_period_index).
  session_status: active | defeated
  """
    active = (
        db.query(GameProfile)
        .filter(GameProfile.user_id == user_id, GameProfile.is_active == 1, GameProfile.is_archived == 0)
        .first()
    )
    if active:
        return active, "active", None, None

    last = (
        db.query(GameProfile)
        .filter(GameProfile.user_id == user_id)
        .order_by(GameProfile.updated_at.desc(), GameProfile.id.desc())
        .first()
    )
    if last and int(last.is_active or 0) == 0:
        reason = _infer_defeat_reason(db, last.id)
        period_idx = int(last.period_index or 0)
        return last, "defeated", reason, period_idx

    if last:
        return last, "active", None, None

    fallback = GameProfile(user_id=user_id, name="Мой первый профиль", save_kind="game", is_active=1)
    db.add(fallback)
    db.commit()
    db.refresh(fallback)
    return fallback, "active", None, None


def sync_time(profile: GameProfile) -> Tuple[int, float]:
    """
    Пошаговый месяц (TB1): real-time не продвигает period_index.
    Закрытие периода — только через process_period_end (POST /api/game/time/next).
    """
    return 0, 0.0


def set_time_state(profile: GameProfile, state: str) -> None:
    normalized = (state or "").strip().lower()
    if normalized not in {"play", "pause"}:
        raise HTTPException(status_code=400, detail="time_state must be play or pause")

    if normalized == "play" and profile.time_state != "play":
        profile.period_anchor_at = utc_now_naive()

    profile.time_state = normalized


def next_period(profile: GameProfile) -> None:
    """Legacy helper: инкремент периода без экономики. В prod используйте process_period_end."""
    sync_time(profile)
    profile.period_index += 1
    profile.period_anchor_at = utc_now_naive()


def set_period_duration(profile: GameProfile, seconds: int) -> None:
    if seconds < 10:
        raise HTTPException(status_code=400, detail="period_duration_seconds must be >= 10")
    profile.period_duration_seconds = seconds
    if profile.time_state == "play":
        profile.period_anchor_at = utc_now_naive()


def get_seconds_until_next(profile: GameProfile) -> int:
    """Turn-based: авто-закрытия по времени нет."""
    return 0
