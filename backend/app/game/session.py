"""Игровая сессия: активный профиль, статус партии (active | defeated), причина поражения."""

from fastapi import HTTPException
from sqlalchemy.orm import Session

from ..models import GameProfile, Transaction
from ..finance.balance_utils import TRANSACTION_TYPES


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
