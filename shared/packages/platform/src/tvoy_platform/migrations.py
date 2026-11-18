"""
Миграции SQL-файлами `NNNN_<slug>.sql`: по порядку номера, каждая ровно один раз.

Применённые записываются в `schema_migrations`. Схема создаётся только этим путём, не при
старте API (то же правило у игры — PR-08). Файл — операторы через `;`, без `;` внутри
строковых литералов; SQL — в общем подмножестве SQLite и Postgres.
"""

from __future__ import annotations

import re
from pathlib import Path

from sqlalchemy import text
from sqlalchemy.engine import Engine

_NAME = re.compile(r"^(\d{4})_[a-z0-9_]+\.sql$")


def migration_files(directory: Path) -> list[Path]:
    files = sorted(p for p in directory.iterdir() if _NAME.match(p.name))
    numbers = [p.name[:4] for p in files]
    if len(numbers) != len(set(numbers)):
        raise ValueError(f"повтор номера миграции в {directory}")
    return files


def applied(engine: Engine) -> set[str]:
    with engine.begin() as conn:
        conn.execute(
            text("CREATE TABLE IF NOT EXISTS schema_migrations (name VARCHAR(200) PRIMARY KEY, applied_at VARCHAR(40) NOT NULL)")
        )
        return {row[0] for row in conn.execute(text("SELECT name FROM schema_migrations"))}


def migrate(engine: Engine, directory: Path) -> list[str]:
    """Применить недостающие миграции; вернуть имена применённых в этом вызове."""
    done = applied(engine)
    new: list[str] = []
    for path in migration_files(directory):
        if path.name in done:
            continue
        statements = [s.strip() for s in path.read_text(encoding="utf-8").split(";") if s.strip()]
        with engine.begin() as conn:
            for stmt in statements:
                conn.execute(text(stmt))
            conn.execute(
                text("INSERT INTO schema_migrations (name, applied_at) VALUES (:n, CURRENT_TIMESTAMP)"),
                {"n": path.name},
            )
        new.append(path.name)
    return new
