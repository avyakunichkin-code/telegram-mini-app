"""
Валидация POST /api/game/start: понятные 4xx до записи в БД.
"""

from __future__ import annotations

from fastapi import HTTPException
from sqlalchemy.orm import Session

from ..models import GameStarterTemplate
from ..schemas import GameStartRequest


def validate_game_start_request(payload: GameStartRequest, db: Session) -> None:
    name = (payload.profile_name or "").strip()
    if not name:
        raise HTTPException(status_code=400, detail="profile_name is required")

    save_kind = (payload.save_kind or "game").strip().lower()
    if save_kind != "game":
        raise HTTPException(status_code=400, detail="save_kind must be 'game'")

    tk = (payload.template_key or "").strip()
    if not tk:
        raise HTTPException(
            status_code=400,
            detail="game saves require template_key (starter template from catalog)",
        )

    if tk:
        tmpl = (
            db.query(GameStarterTemplate)
            .filter(GameStarterTemplate.template_key == tk, GameStarterTemplate.is_active == 1)
            .first()
        )
        if not tmpl:
            raise HTTPException(status_code=404, detail="starter template not found")

        applies = (getattr(tmpl, "applies_to_save_kind", None) or "game").strip().lower()
        if applies not in ("game", "any"):
            raise HTTPException(
                status_code=400,
                detail="This starter template is not available for Game",
            )

    if payload.cash_balance < 0:
        raise HTTPException(status_code=400, detail="cash_balance cannot be negative")
    if payload.monthly_salary < 0:
        raise HTTPException(status_code=400, detail="monthly_salary cannot be negative")
