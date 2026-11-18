"""Уникальный username при регистрации по email (локальная часть + домен)."""

from __future__ import annotations

import re
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from sqlalchemy.orm import Session

_USERNAME_RE = re.compile(r"[^a-z0-9_]+")


def _sanitize_part(value: str) -> str:
    return _USERNAME_RE.sub("", (value or "").lower())


def username_base_from_email(email: str) -> str:
    """Кандидат username: local_domain (gmail.com → local_gmail_com)."""
    normalized = (email or "").strip().lower()
    local, _, domain = normalized.partition("@")
    local_part = _sanitize_part(local)
    domain_part = _sanitize_part(domain.replace(".", "_"))
    if len(local_part) < 2:
        tail = _sanitize_part(normalized.replace("@", "_"))
        local_part = tail[:8] if len(tail) >= 2 else "mqplayer"
    if not domain_part:
        domain_part = "mail"
    base = f"{local_part}_{domain_part}"
    return base[:45]


def allocate_username_from_email(db: Session, email: str) -> str:
    """Возвращает свободный username для email (с суффиксом _2, _3 при коллизии)."""
    from .models import User

    base = username_base_from_email(email)
    candidate = base[:50]
    suffix = 2
    while db.query(User).filter(User.username == candidate).first():
        tail = f"_{suffix}"
        candidate = f"{base[: 50 - len(tail)]}{tail}"
        suffix += 1
        if suffix > 10_000:
            raise ValueError("Could not allocate username")
    return candidate
