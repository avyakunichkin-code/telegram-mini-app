"""
JWT приложения: подпись и проверка с обязательными `iss`, `aud`, `exp`, `sub`.

`iss`/`aud` разводят приложения (ADR-016 п.5): токен игры не принимается Plan даже при
случайно совпавшем секрете. Алгоритм фиксирован (HS256), `alg` из заголовка токена не читаем.
"""

from __future__ import annotations

import os
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

import jwt

ALGORITHM = "HS256"
MIN_SECRET_BYTES = 32  # HS256: ключ не короче выхода хеша (RFC 7518 §3.2)
_PLACEHOLDER_SECRETS = frozenset({"", "change-me", "default-secret-key-change-me"})


class InvalidToken(Exception):
    """Токен не прошёл проверку: подпись, срок, iss/aud или нет `sub`. Приложение отвечает 401."""


@dataclass(frozen=True)
class TokenIssuer:
    secret: str
    issuer: str
    audience: str
    ttl: timedelta = timedelta(days=7)

    def __post_init__(self) -> None:
        if len(self.secret.encode()) < MIN_SECRET_BYTES:
            raise ValueError(f"секрет JWT короче {MIN_SECRET_BYTES} байт")
        if not self.issuer or not self.audience:
            raise ValueError("iss и aud обязательны")

    def issue(self, subject: str, *, now: datetime | None = None, **claims) -> str:
        now = now or datetime.now(timezone.utc)
        payload = {
            **claims,
            "sub": str(subject),
            "iss": self.issuer,
            "aud": self.audience,
            "iat": now,
            "exp": now + self.ttl,
        }
        return jwt.encode(payload, self.secret, algorithm=ALGORITHM)

    def verify(self, token: str) -> dict:
        try:
            return jwt.decode(
                token,
                self.secret,
                algorithms=[ALGORITHM],
                issuer=self.issuer,
                audience=self.audience,
                options={"require": ["exp", "iss", "aud", "sub"]},
            )
        except jwt.InvalidTokenError as exc:
            raise InvalidToken(str(exc)) from exc


def secret_from_env(var: str, *, production: bool, dev_fallback: str) -> str:
    """Секрет из окружения. В проде пустой или шаблонный секрет — ошибка старта, а не тихий dev-ключ."""
    raw = os.getenv(var, "").strip()
    if raw not in _PLACEHOLDER_SECRETS:
        return raw
    if production:
        raise RuntimeError(f"{var} не задан (или шаблонный) в production: подписывать JWT известным ключом нельзя")
    return dev_fallback
