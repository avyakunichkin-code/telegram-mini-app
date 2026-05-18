"""
Ops-уведомления (MVP 1.2 A0 Watchtower).

emit_admin_alert → notification_log + опционально Telegram ops-канал.
"""

from __future__ import annotations

import json
import logging
import urllib.error
import urllib.parse
import urllib.request
from typing import Any, Optional

from sqlalchemy.orm import Session

from .config import config
from .models import GameProfile, NotificationLog, User
from .profile_victory import profile_win_reached

logger = logging.getLogger(__name__)

_KIND_EMOJI = {
    "user_registered": "🟢",
    "profile_created": "📁",
    "game_started": "🎮",
    "game_won": "🏁",
    "game_lost": "💀",
    "period_milestone": "📅",
}


def _admin_link(path: str) -> str:
    base = config.ADMIN_WEB_BASE_URL
    if not path.startswith("/"):
        path = f"/{path}"
    if "#" in base and not path.startswith("#"):
        return f"{base}{path}"
    return f"{base}{path}"


def _format_telegram_text(kind: str, payload: dict[str, Any]) -> str:
    emoji = _KIND_EMOJI.get(kind, "ℹ️")
    lines = [f"{emoji} {kind}"]
    for key in sorted(payload.keys()):
        if key.startswith("_"):
            continue
        val = payload[key]
        if val is None or val == "":
            continue
        lines.append(f"{key}={val}")
    link = payload.get("_admin_link")
    if link:
        lines.append(f"→ {link}")
    return "\n".join(lines)


def _send_telegram_message(text: str) -> bool:
    token = config.OPS_TELEGRAM_BOT_TOKEN
    chat_id = config.OPS_TELEGRAM_CHAT_ID
    if not token or not chat_id:
        return False
    url = f"https://api.telegram.org/bot{token}/sendMessage"
    body = urllib.parse.urlencode(
        {
            "chat_id": chat_id,
            "text": text[:4096],
            "disable_web_page_preview": "true",
        }
    ).encode("utf-8")
    req = urllib.request.Request(url, data=body, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=8) as resp:
            return 200 <= resp.status < 300
    except (urllib.error.URLError, TimeoutError, OSError) as exc:
        logger.warning("Telegram ops send failed: %s", exc)
        return False


def emit_admin_alert(
    db: Session,
    kind: str,
    payload: Optional[dict[str, Any]] = None,
    *,
    user_id: Optional[int] = None,
    game_profile_id: Optional[int] = None,
    dedupe_key: Optional[str] = None,
) -> Optional[NotificationLog]:
    """
  Записать алерт и отправить в Telegram (если настроено).
  При dedupe_key и существующей записи — no-op.
    """
    payload = dict(payload or {})

    if dedupe_key:
        existing = (
            db.query(NotificationLog)
            .filter(NotificationLog.dedupe_key == dedupe_key)
            .first()
        )
        if existing:
            return None

    if user_id and "user_id" not in payload:
        payload["user_id"] = user_id
    if game_profile_id and "profile_id" not in payload:
        payload["profile_id"] = game_profile_id

    if user_id and "_admin_link" not in payload:
        payload["_admin_link"] = _admin_link(f"/admin?user={user_id}")
    elif game_profile_id and "_admin_link" not in payload:
        payload["_admin_link"] = _admin_link(f"/admin?profile={game_profile_id}")

    telegram_sent = 0
    if config.OPS_TELEGRAM_BOT_TOKEN and config.OPS_TELEGRAM_CHAT_ID:
        if _send_telegram_message(_format_telegram_text(kind, payload)):
            telegram_sent = 1

    row = NotificationLog(
        audience="admin",
        kind=kind,
        dedupe_key=dedupe_key,
        user_id=user_id,
        game_profile_id=game_profile_id,
        payload_json=json.dumps(payload, ensure_ascii=False),
        telegram_sent=telegram_sent,
    )
    db.add(row)
    try:
        db.commit()
    except Exception:
        db.rollback()
        logger.exception("Failed to persist admin alert kind=%s", kind)
        return None
    db.refresh(row)
    return row


def notify_user_registered(db: Session, user: User) -> None:
    emit_admin_alert(
        db,
        "user_registered",
        {
            "username": user.username,
            "telegram_id": user.telegram_id,
            "_admin_link": _admin_link("/admin"),
        },
        user_id=user.id,
        dedupe_key=f"user_registered:{user.id}",
    )


def notify_profile_created(db: Session, profile: GameProfile) -> None:
    emit_admin_alert(
        db,
        "profile_created",
        {
            "name": profile.name,
            "save_kind": profile.save_kind,
            "profile_id": profile.id,
            "_admin_link": _admin_link(f"/admin?profile={profile.id}"),
        },
        user_id=profile.user_id,
        game_profile_id=profile.id,
        dedupe_key=f"profile_created:{profile.id}",
    )


def notify_game_started(db: Session, profile: GameProfile) -> None:
    emit_admin_alert(
        db,
        "game_started",
        {
            "name": profile.name,
            "template": profile.starter_template_key or "manual",
            "save_kind": profile.save_kind,
            "period_duration_seconds": profile.period_duration_seconds,
            "profile_id": profile.id,
            "_admin_link": _admin_link(f"/admin?profile={profile.id}"),
        },
        user_id=profile.user_id,
        game_profile_id=profile.id,
        dedupe_key=f"game_started:{profile.id}",
    )


def notify_game_lost(db: Session, profile: GameProfile, *, period_index: int) -> None:
    if profile.is_active != 0:
        return
    emit_admin_alert(
        db,
        "game_lost",
        {
            "name": profile.name,
            "period_index": period_index,
            "cash_balance": round(float(profile.cash_balance or 0), 2),
            "profile_id": profile.id,
            "_admin_link": _admin_link(f"/admin?profile={profile.id}"),
        },
        user_id=profile.user_id,
        game_profile_id=profile.id,
        dedupe_key=f"game_lost:{profile.id}",
    )


def notify_period_milestone(db: Session, profile: GameProfile, *, closed_period_index: int) -> None:
    if closed_period_index not in (1, 3, 7):
        return
    emit_admin_alert(
        db,
        "period_milestone",
        {
            "name": profile.name,
            "closed_period": closed_period_index,
            "next_period": int(profile.period_index),
            "profile_id": profile.id,
            "_admin_link": _admin_link(f"/admin?profile={profile.id}"),
        },
        user_id=profile.user_id,
        game_profile_id=profile.id,
        dedupe_key=f"period_milestone:{profile.id}:{closed_period_index}",
    )


def maybe_notify_game_won(db: Session, profile: GameProfile) -> None:
    if profile.is_active == 0:
        return
    try:
        if not profile_win_reached(db, profile):
            return
    except Exception:
        logger.exception("Victory check failed for profile %s", profile.id)
        return
    emit_admin_alert(
        db,
        "game_won",
        {
            "name": profile.name,
            "template": profile.starter_template_key or "manual",
            "period_index": profile.period_index,
            "profile_id": profile.id,
            "_admin_link": _admin_link(f"/admin?profile={profile.id}"),
        },
        user_id=profile.user_id,
        game_profile_id=profile.id,
        dedupe_key=f"game_won:{profile.id}",
    )


def process_period_admin_alerts(db: Session, profile: GameProfile, *, closed_period_index: int) -> None:
    """Хуки после commit конца периода (profile уже с новым period_index)."""
    notify_period_milestone(db, profile, closed_period_index=closed_period_index)
    if profile.is_active == 0:
        notify_game_lost(db, profile, period_index=closed_period_index)
    else:
        maybe_notify_game_won(db, profile)
