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

    if save_kind == "plan" and payload.template_key:
        raise HTTPException(
            status_code=400,
            detail="Plan saves cannot use game starter templates; omit template_key",
        )

    if save_kind == "game":
        tk = (payload.template_key or "").strip()
        if not tk:
            raise HTTPException(
                status_code=400,
                detail="game saves require template_key (starter template from catalog)",
            )

    if payload.period_duration_seconds < 10:
        raise HTTPException(status_code=400, detail="period_duration_seconds must be >= 10")
    if payload.cash_balance < 0:
        raise HTTPException(status_code=400, detail="cash_balance cannot be negative")
    if payload.monthly_salary < 0:
        raise HTTPException(status_code=400, detail="monthly_salary cannot be negative")

    if payload.template_key:
        tk = payload.template_key.strip()
        if not tk:
            raise HTTPException(status_code=400, detail="template_key is empty")
        tmpl = (
            db.query(GameStarterTemplate)
            .filter(GameStarterTemplate.template_key == tk, GameStarterTemplate.is_active == 1)
            .first()
        )
        if not tmpl:
            raise HTTPException(status_code=404, detail="game template not found")
