"""Player Telegram webhook (PLT-202)."""

from __future__ import annotations

import logging
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from ..config import config
from ..database import get_db
from ..telegram.player_webhook import process_player_update

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/telegram", tags=["telegram"])


def _verify_webhook_secret(request: Request) -> None:
    secret = config.PLAYER_TELEGRAM_WEBHOOK_SECRET
    if not secret:
        return
    header = request.headers.get("X-Telegram-Bot-Api-Secret-Token", "")
    if header != secret:
        raise HTTPException(status_code=403, detail="Invalid webhook secret")


@router.post("/webhook/player")
async def player_telegram_webhook(
    request: Request,
    db: Session = Depends(get_db),
) -> dict[str, str]:
    """
    Telegram Bot API webhook для @TvoyHodBot.
    Обрабатывает /start и /help; сохраняет telegram_chat_id при совпадении users.telegram_id.
    """
    _verify_webhook_secret(request)
    try:
        update: dict[str, Any] = await request.json()
    except Exception as exc:
        logger.warning("player webhook: invalid JSON: %s", exc)
        raise HTTPException(status_code=400, detail="Invalid JSON") from exc

    try:
        process_player_update(db, update)
    except Exception:
        logger.exception("player webhook handler failed")
        # Telegram ретраит при non-2xx — отвечаем 200, ошибка в логах
    return {"ok": "true"}
