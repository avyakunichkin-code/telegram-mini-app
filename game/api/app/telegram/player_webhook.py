"""Обработка Update player-бота: /start, /help (PLT-202…204)."""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any, Optional

from sqlalchemy.orm import Session

from ..admin.notify import emit_admin_alert
from ..config import resolve_player_web_app_url
from ..models import User
from .client import send_player_message

logger = logging.getLogger(__name__)

_WELCOME_TEXT = (
    "Привет! Я Монетка — помогу разобраться с деньгами в игре ТВОЙ ХОД.\n"
    "Нажми «Играть», чтобы открыть приложение."
)

_HELP_TEXT = (
    "ТВОЙ ХОД — игра про личные финансы: зарплата, обязательства, события и цели.\n\n"
    "Команды:\n"
    "/start — открыть игру\n"
    "/help — эта справка\n\n"
    "Вопросы и фидбек — напишите в чат playtest или команде проекта."
)


def _play_keyboard() -> dict[str, Any]:
    return {
        "inline_keyboard": [
            [
                {
                    "text": "Играть",
                    "web_app": {"url": resolve_player_web_app_url()},
                }
            ]
        ]
    }


def _find_user_by_telegram_id(db: Session, telegram_user_id: int) -> Optional[User]:
    return db.query(User).filter(User.telegram_id == telegram_user_id).first()


def _link_chat_to_user(
    db: Session,
    user: User,
    *,
    telegram_user_id: int,
    chat_id: int,
) -> None:
    if user.telegram_id is None:
        user.telegram_id = telegram_user_id
    if user.telegram_chat_id != chat_id:
        user.telegram_chat_id = chat_id
    if user.telegram_started_at is None:
        user.telegram_started_at = datetime.now(timezone.utc).replace(tzinfo=None)


def _emit_player_bot_started(
    db: Session,
    *,
    telegram_user_id: int,
    chat_id: int,
    username: Optional[str],
    user: Optional[User],
) -> None:
    payload: dict[str, Any] = {
        "telegram_id": telegram_user_id,
        "telegram_chat_id": chat_id,
        "username": username,
    }
    if user is not None:
        payload["name"] = user.username
        payload["user_id"] = user.id
    emit_admin_alert(
        db,
        "player_bot_started",
        payload,
        user_id=user.id if user else None,
        dedupe_key=f"player_bot_started:{telegram_user_id}",
        send_telegram=False,
    )


def _handle_start(db: Session, message: dict[str, Any]) -> None:
    from_user = message.get("from") or {}
    chat = message.get("chat") or {}
    telegram_user_id = from_user.get("id")
    chat_id = chat.get("id")
    if telegram_user_id is None or chat_id is None:
        return

    username = from_user.get("username")
    user = _find_user_by_telegram_id(db, int(telegram_user_id))
    if user is not None:
        _link_chat_to_user(
            db,
            user,
            telegram_user_id=int(telegram_user_id),
            chat_id=int(chat_id),
        )
        db.commit()

    _emit_player_bot_started(
        db,
        telegram_user_id=int(telegram_user_id),
        chat_id=int(chat_id),
        username=username,
        user=user,
    )

    send_player_message(
        int(chat_id),
        _WELCOME_TEXT,
        reply_markup=_play_keyboard(),
    )


def _handle_help(chat_id: int) -> None:
    send_player_message(int(chat_id), _HELP_TEXT, reply_markup=_play_keyboard())


def _command_from_text(text: str) -> tuple[str, str]:
    """Вернуть (команда, аргументы) из message.text."""
    raw = (text or "").strip()
    if not raw.startswith("/"):
        return "", raw
    head, _, tail = raw.partition(" ")
    cmd = head.split("@", 1)[0].lower()
    return cmd, tail.strip()


def process_player_update(db: Session, update: dict[str, Any]) -> None:
    """Разобрать Telegram Update и ответить на команды player-бота."""
    message = update.get("message")
    if not message:
        return

    text = message.get("text") or ""
    cmd, _args = _command_from_text(text)
    chat = message.get("chat") or {}
    chat_id = chat.get("id")
    if chat_id is None:
        return

    if cmd in ("/start",):
        _handle_start(db, message)
        return
    if cmd in ("/help",):
        _handle_help(chat_id)
        return
