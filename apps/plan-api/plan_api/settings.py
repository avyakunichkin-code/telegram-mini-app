"""
Настройки plan-api из окружения (префикс `PLAN_`). Свои секрет и БД — не игры (ADR-016 п.5).

`PLAN_ENV=production` включает строгий режим: без секрета старт падает, `dev_code` и
`/api/dev/*` выключены, миграции не применяются при старте (только `py -3 -m plan_api.migrate`).
Пока юрист по ПДн не дал добро, production не разворачивается (ADR-017 п.2–3).
"""

from __future__ import annotations

import os
from dataclasses import dataclass, field
from datetime import timedelta
from pathlib import Path

from tvoy_platform.tokens import secret_from_env

from .analytics import CONSENT_VERSION

MIGRATIONS = Path(__file__).resolve().parents[1] / "migrations"
_DEV_SECRET = "plan-dev-only-insecure-secret-do-not-deploy"


def _origins() -> list[str]:
    return os.environ.get("PLAN_CORS_ORIGINS", "http://localhost:5190,http://127.0.0.1:5190").split(",")


@dataclass(frozen=True)
class Settings:
    env: str = "dev"
    database_url: str = "sqlite:///./plan_dev.db"
    secret_key: str = _DEV_SECRET
    cors_origins: list[str] = field(default_factory=_origins)
    token_ttl: timedelta = timedelta(days=30)
    code_ttl: timedelta = timedelta(minutes=10)
    code_attempts: int = 5
    codes_per_email: int = 3  # за 10 мин
    codes_per_ip: int = 20  # за час
    trusted_proxies: int = 0  # сколько своих прокси дописывают X-Forwarded-For

    @property
    def production(self) -> bool:
        return self.env == "production"

    @property
    def expose_dev_code(self) -> bool:
        """Письма — заглушкой в лог; в dev код ещё и в ответе, чтобы пройти вход без почты."""
        return not self.production and self.database_url.startswith("sqlite")

    @classmethod
    def from_env(cls) -> "Settings":
        env = os.environ.get("PLAN_ENV", "dev")
        database_url = os.environ.get("PLAN_DATABASE_URL", "sqlite:///./plan_dev.db")
        if env not in ("dev", "production"):
            raise RuntimeError(f"PLAN_ENV: неизвестное значение {env!r}")
        if env == "dev" and not database_url.startswith("sqlite"):
            # Забытый PLAN_ENV не должен включать dev_code и публичный секрет на настоящей БД.
            raise RuntimeError("PLAN_ENV=dev разрешён только с SQLite; на PostgreSQL нужен PLAN_ENV=production")
        proxies = os.environ.get("PLAN_TRUSTED_PROXIES", "")
        if env == "production":
            if not proxies.isdigit():
                raise RuntimeError("PLAN_TRUSTED_PROXIES обязателен в production: число своих прокси перед API, 0 если их нет")
            if CONSENT_VERSION.endswith("-proto"):
                raise RuntimeError("Текст согласия не утверждён: CONSENT_VERSION ещё прототип (gate юриста G1)")
        return cls(
            env=env,
            database_url=database_url,
            trusted_proxies=int(proxies) if proxies.isdigit() else 0,
            secret_key=secret_from_env("PLAN_SECRET_KEY", production=env == "production", dev_fallback=_DEV_SECRET),
        )
