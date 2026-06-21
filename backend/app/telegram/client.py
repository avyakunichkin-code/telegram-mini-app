"""HTTP-клиент player-бота (@TvoyHodBot)."""

from __future__ import annotations

import json
import logging
import urllib.error
import urllib.parse
import urllib.request
from typing import Any, Optional

from ..config import config

logger = logging.getLogger(__name__)


def send_player_message(
    chat_id: int,
    text: str,
    *,
    reply_markup: Optional[dict[str, Any]] = None,
) -> bool:
    """Отправить сообщение в chat_id через PLAYER_TELEGRAM_BOT_TOKEN."""
    token = config.PLAYER_TELEGRAM_BOT_TOKEN
    if not token:
        logger.warning("PLAYER_TELEGRAM_BOT_TOKEN not set; skip sendMessage")
        return False

    url = f"https://api.telegram.org/bot{token}/sendMessage"
    fields: dict[str, str] = {
        "chat_id": str(chat_id),
        "text": text[:4096],
        "disable_web_page_preview": "true",
    }
    if reply_markup is not None:
        fields["reply_markup"] = json.dumps(reply_markup, ensure_ascii=False)

    body = urllib.parse.urlencode(fields).encode("utf-8")
    req = urllib.request.Request(url, data=body, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=8) as resp:
            return 200 <= resp.status < 300
    except (urllib.error.URLError, TimeoutError, OSError) as exc:
        logger.warning("player sendMessage failed: %s", exc)
        return False
