"""Единая точка для меток времени UTC без DeprecationWarning `datetime.utcnow`."""
from __future__ import annotations

from datetime import datetime, timezone


def utc_now_naive() -> datetime:
    """Текущий момент в UTC как naive datetime (колонки `DateTime` без timezone в моделях)."""
    return datetime.now(timezone.utc).replace(tzinfo=None)
