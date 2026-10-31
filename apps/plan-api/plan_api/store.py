"""
Хранилище прототипа — в памяти процесса (заглушка вместо БД `plan`, SPL-402).

Контракт методов повторяет будущий репозиторий: изоляция по пользователю, один черновик на
домохозяйство, завершённый чекап — только чтение. Перезапуск процесса стирает данные.
"""

from __future__ import annotations

import secrets
import threading
from dataclasses import dataclass, field
from datetime import datetime, timezone

from .schemas import Checkup, Member


def new_id(prefix: str) -> str:
    return f"{prefix}_{secrets.token_hex(6)}"


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


@dataclass
class User:
    id: str
    email: str
    consent_version: str | None = None
    members: list[Member] = field(default_factory=list)
    deleted_at: str | None = None


@dataclass
class Store:
    users: dict[str, User] = field(default_factory=dict)  # by id
    by_email: dict[str, str] = field(default_factory=dict)
    codes: dict[str, str] = field(default_factory=dict)  # email → code
    tokens: dict[str, str] = field(default_factory=dict)  # token → user_id
    checkups: dict[str, tuple[str, Checkup]] = field(default_factory=dict)  # id → (user_id, checkup)
    reports: dict[str, dict] = field(default_factory=dict)  # checkup_id → report
    steps: dict[str, tuple[str, dict]] = field(default_factory=dict)  # step_id → (user_id, step)
    events: list[dict] = field(default_factory=list)
    lock: threading.Lock = field(default_factory=threading.Lock)

    def user_checkups(self, user_id: str) -> list[Checkup]:
        return [ck for uid, ck in self.checkups.values() if uid == user_id]

    def delete_user(self, user_id: str) -> None:
        """В прототипе удаляем сразу; в проде — `deleted_at` + purge ≤ 30 дней (152-ФЗ)."""
        user = self.users.pop(user_id, None)
        if user:
            self.by_email.pop(user.email, None)
        self.tokens = {t: u for t, u in self.tokens.items() if u != user_id}
        for cid in [cid for cid, (uid, _) in self.checkups.items() if uid == user_id]:
            self.checkups.pop(cid)
            self.reports.pop(cid, None)
        self.steps = {sid: v for sid, v in self.steps.items() if v[0] != user_id}
        self.events = [e for e in self.events if e.get("user_id") != user_id]


store = Store()
