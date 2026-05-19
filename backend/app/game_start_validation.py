"""
Валидация POST /api/game/start: понятные 4xx до записи в БД.
"""

from __future__ import annotations

from fastapi import HTTPException
from sqlalchemy.orm import Session

from .models import GameStarterTemplate
from .schemas import GameStartRequest


def validate_game_start_request(payload: GameStartRequest, db: Session) -> None:
    name = (payload.profile_name or "").strip()
    if not name:
        raise HTTPException(status_code=400, detail="profile_name is required")

    save_kind = (payload.save_kind or "game").strip().lower()
    if save_kind not in ("game", "plan"):
        raise HTTPException(status_code=400, detail="save_kind must be 'game' or 'plan'")

    tk = (payload.template_key or "").strip()
    if not tk:
        raise HTTPException(
            status_code=400,
            detail="template_key is required — выберите стартовый шаблон из каталога",
        )

    tmpl = (
        db.query(GameStarterTemplate)
        .filter(GameStarterTemplate.template_key == tk, GameStarterTemplate.is_active == 1)
        .first()
    )
    if not tmpl:
        raise HTTPException(status_code=404, detail="starter template not found")

    applies = (getattr(tmpl, "applies_to_save_kind", None) or "game").strip().lower()
    if save_kind == "game" and applies not in ("game", "any"):
        raise HTTPException(
            status_code=400,
            detail="This starter template is only for Plan mode",
        )
    if save_kind == "plan" and applies not in ("plan", "any"):
        raise HTTPException(
            status_code=400,
            detail="This starter template is only for Game mode",
        )

    if payload.period_duration_seconds < 10:
        raise HTTPException(status_code=400, detail="period_duration_seconds must be >= 10")
    if payload.cash_balance < 0:
        raise HTTPException(status_code=400, detail="cash_balance cannot be negative")
    if payload.monthly_salary < 0:
        raise HTTPException(status_code=400, detail="monthly_salary cannot be negative")
