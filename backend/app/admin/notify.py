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

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..config import _resolve_admin_web_base_url
from ..models import GameProfile, NotificationLog, User
from ..victory.profile import profile_win_reached

logger = logging.getLogger(__name__)

_KIND_EMOJI = {
    "user_registered": "🟢",
    "profile_created": "📁",
    "game_started": "🎮",
    "game_won": "🏁",
    "game_lost": "💀",
    "period_milestone": "📅",
    "onboarding_step_reached": "👣",
    "onboarding_brief_done": "✅",
    "onboarding_skipped": "⏭️",
}


def _admin_link(path: str) -> str:
    base = _resolve_admin_web_base_url().rstrip("/")
    if not path.startswith("/"):
        path = f"/{path}"
    if "#" in base:
        return f"{base}{path}"
    return f"{base}/#{path}"


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
    from ..config import config

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


def _session_has_foreign_pending(db: Session) -> bool:
    """Есть ли на сессии незакоммиченные изменения кроме будущей строки notification_log."""
    return bool(db.new or db.dirty or db.deleted)


def emit_admin_alert(
    db: Session,
    kind: str,
    payload: Optional[dict[str, Any]] = None,
    *,
    user_id: Optional[int] = None,
    game_profile_id: Optional[int] = None,
    dedupe_key: Optional[str] = None,
    send_telegram: bool = True,
) -> Optional[NotificationLog]:
    """
    Записать алерт и отправить в Telegram (если настроено).
    При dedupe_key и существующей записи — no-op.

    Если на сессии уже есть чужие pending-изменения — только flush (без commit),
    чтобы не закоммитить чужую работу. Иначе — commit только записи алерта.
    """
    from ..config import config

    payload = dict(payload or {})
    foreign_pending = _session_has_foreign_pending(db)

    with db.no_autoflush:
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
    if (
        send_telegram
        and config.OPS_TELEGRAM_BOT_TOKEN
        and config.OPS_TELEGRAM_CHAT_ID
    ):
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
    try:
        with db.no_autoflush:
            if foreign_pending:
                with db.begin_nested():
                    db.add(row)
                    db.flush()
            else:
                db.add(row)
        if not foreign_pending:
            db.commit()
        db.refresh(row)
        return row
    except IntegrityError:
        return None
    except Exception:
        if not foreign_pending:
            db.rollback()
        logger.exception("Failed to persist admin alert kind=%s", kind)
        return None


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


def notify_onboarding_step_reached(
    db: Session,
    profile: GameProfile,
    *,
    step: str,
    period_index: int,
) -> None:
    emit_admin_alert(
        db,
        "onboarding_step_reached",
        {
            "name": profile.name,
            "step": step,
            "period_index": period_index,
            "profile_id": profile.id,
            "_admin_link": _admin_link(f"/admin?profile={profile.id}"),
        },
        user_id=profile.user_id,
        game_profile_id=profile.id,
        dedupe_key=f"onboarding_step:{profile.id}:{step}",
        send_telegram=False,
    )


def notify_onboarding_brief_done(db: Session, profile: GameProfile) -> None:
    emit_admin_alert(
        db,
        "onboarding_brief_done",
        {
            "name": profile.name,
            "template": profile.starter_template_key or "manual",
            "period_index": profile.period_index,
            "profile_id": profile.id,
            "_admin_link": _admin_link(f"/admin?profile={profile.id}"),
        },
        user_id=profile.user_id,
        game_profile_id=profile.id,
        dedupe_key=f"onboarding_brief_done:{profile.id}",
    )


def notify_onboarding_skipped(
    db: Session,
    profile: GameProfile,
    *,
    skip_count: int,
    step: str,
) -> None:
    emit_admin_alert(
        db,
        "onboarding_skipped",
        {
            "name": profile.name,
            "skip_count": skip_count,
            "step": step,
            "profile_id": profile.id,
            "_admin_link": _admin_link(f"/admin?profile={profile.id}"),
        },
        user_id=profile.user_id,
        game_profile_id=profile.id,
        dedupe_key=f"onboarding_skipped:{profile.id}:{skip_count}",
        send_telegram=skip_count >= 2,
    )


def process_period_admin_alerts(db: Session, profile: GameProfile, *, closed_period_index: int) -> None:
    """Хуки после commit конца периода (profile уже с новым period_index)."""
    notify_period_milestone(db, profile, closed_period_index=closed_period_index)
    if profile.is_active == 0:
        notify_game_lost(db, profile, period_index=closed_period_index)
    else:
        maybe_notify_game_won(db, profile)
