"""Схема БД на старте: PostgreSQL — только сверка, DDL — `db.sh migrate` (PR-08).

Канон схемы — `backend/migrations/` через `bash backend/scripts/db.sh migrate`.
API не пишет DDL в PostgreSQL: сверяет таблицы и колонки с `app.models` и,
если миграции не прогнаны, падает на старте с понятной подсказкой.

SQLite (e2e-стенд, balance_simulate, локальные эксперименты) — одноразовая
БД без SQL-миграций: там `create_all` по-прежнему поднимает схему из ORM.
"""

from __future__ import annotations

from sqlalchemy import inspect
from sqlalchemy.engine import Engine

from .database import Base

MIGRATE_HINT = "bash backend/scripts/db.sh migrate"

# Таблицы без ORM-модели, которые должны прийти из migrations/ (по диалекту).
# victory_goals — JSONB, Postgres-only; на SQLite goals_store читает victory_config_json.
RAW_TABLES_BY_DIALECT: dict[str, tuple[str, ...]] = {"postgresql": ("victory_goals",)}


class SchemaOutOfDateError(RuntimeError):
    """БД отстаёт от `app.models`: не прогнаны миграции."""


def missing_schema(engine: Engine) -> list[str]:
    """Таблицы (`name`) и колонки (`table.column`) ORM, которых нет в БД.

    Лишние объекты (legacy-таблицы, колонки без модели) не считаются ошибкой.
    """
    import app.models  # noqa: F401 — регистрирует таблицы в Base.metadata

    inspector = inspect(engine)
    existing = set(inspector.get_table_names())
    missing: list[str] = []
    for table in Base.metadata.sorted_tables:
        if table.name not in existing:
            missing.append(table.name)
            continue
        db_cols = {c["name"] for c in inspector.get_columns(table.name)}
        missing.extend(f"{table.name}.{col.name}" for col in table.columns if col.name not in db_cols)
    missing.extend(t for t in RAW_TABLES_BY_DIALECT.get(engine.dialect.name, ()) if t not in existing)
    return missing


def prepare_schema(engine: Engine, *, auto_create: bool | None = None) -> None:
    """Привести схему к рабочему виду перед сидами.

    auto_create=None → только для SQLite. Для PostgreSQL DDL не выполняется.
    """
    if auto_create is None:
        auto_create = engine.dialect.name == "sqlite"
    if auto_create:
        import app.models  # noqa: F401

        Base.metadata.create_all(bind=engine)
        return

    missing = missing_schema(engine)
    if missing:
        shown = ", ".join(missing[:10]) + (f" … ещё {len(missing) - 10}" if len(missing) > 10 else "")
        raise SchemaOutOfDateError(
            f"Схема БД отстаёт от моделей ({len(missing)}): {shown}. "
            f"Прогони миграции: {MIGRATE_HINT} (пустая БД — db.sh bootstrap)."
        )
