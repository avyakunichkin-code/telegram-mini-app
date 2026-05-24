"""CORS для Mini App: origins из env + regex для GitHub Pages."""
from __future__ import annotations

import os
import re
from urllib.parse import urlparse

# Локальная разработка (Vite, uvicorn, live-server)
DEFAULT_LOCAL_ORIGINS = (
    "http://localhost:5173",
    "http://localhost:4173",
    "http://localhost:3000",
    "http://localhost:8000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:4173",
    "http://127.0.0.1:5500",
)

# Поддомены *.github.io (старый стенд и форки)
DEFAULT_CORS_ORIGIN_REGEX = r"^https://[\w-]+\.github\.io$"


def _split_csv(raw: str) -> list[str]:
    return [part.strip() for part in (raw or "").split(",") if part.strip()]


def origin_from_public_url(url: str) -> str | None:
    """Из PUBLIC_APP_URL / ADMIN_WEB_BASE_URL извлекает origin для CORS."""
    raw = (url or "").strip()
    if not raw:
        return None
    parsed = urlparse(raw if "://" in raw else f"https://{raw}")
    if not parsed.scheme or not parsed.netloc:
        return None
    return f"{parsed.scheme}://{parsed.netloc}"


def resolve_cors_allow_origins() -> list[str]:
    """
    Явные origins: локальные + CORS_ALLOW_ORIGINS + origin из PUBLIC_APP_URL.
    """
    seen: set[str] = set()
    out: list[str] = []

    def add(value: str) -> None:
        if value and value not in seen:
            seen.add(value)
            out.append(value)

    for origin in DEFAULT_LOCAL_ORIGINS:
        add(origin)

    for origin in _split_csv(os.getenv("CORS_ALLOW_ORIGINS", "")):
        add(origin)

    for key in ("PUBLIC_APP_URL", "ADMIN_WEB_BASE_URL"):
        add(origin_from_public_url(os.getenv(key, "")) or "")

    # Обратная совместимость со старым GitHub Pages
    add("https://avyakunichkin-code.github.io")

    return out


def resolve_cors_allow_origin_regex() -> str | None:
    """
    Regex для origin. CORS_ALLOW_ORIGIN_REGEX=none — отключить.
    Пусто — дефолт для *.github.io.
    """
    raw = os.getenv("CORS_ALLOW_ORIGIN_REGEX", "").strip()
    if raw.lower() in ("none", "-", "off", "false", "0"):
        return None
    if raw:
        try:
            re.compile(raw)
        except re.error as exc:
            raise ValueError(f"Invalid CORS_ALLOW_ORIGIN_REGEX: {exc}") from exc
        return raw
    return DEFAULT_CORS_ORIGIN_REGEX
