"""Дрейф схемы: SQL-миграции (прод, PostgreSQL) против SQLAlchemy-моделей.

Backend-тесты строят схему из моделей на SQLite, миграции в них не участвуют. Этот тест берёт БД,
на которую уже применён `db.sh migrate`, и сверяет её с `Base.metadata`.
Запускается только при `TEST_DATABASE_URL=postgresql://...`; иначе пропускается (локально и в основном job).
План: docs/game/plans/PLAN_ci-postgres-parity.md, срез 2.

Наличие таблиц и колонок проверяет `app.db_schema.missing_schema` (она же роняет API на старте).
Здесь добавлено то, чего старт не ловит: совпадение NOT NULL. Типы пока не сверяются:
диалекты SQLite/PG и алиасы типов дают много ложных срабатываний.
Лишние в БД таблицы и колонки (нет в моделях) не считаются ошибкой, их только печатаем.
"""

from __future__ import annotations

import os

import pytest
from sqlalchemy import create_engine, inspect

from app.database import Base
from app.db_schema import missing_schema

pytestmark = pytest.mark.pg

_URL = os.environ.get("TEST_DATABASE_URL", "")

# Известные намеренные расхождения NOT NULL: "table.column" -> причина. Пополнять только с причиной.
KNOWN_NULLABILITY_DRIFT: dict[str, str] = {}


def _engine():
    url = _URL
    if url.startswith("postgresql://"):
        url = "postgresql+psycopg://" + url[len("postgresql://"):]
    return create_engine(url)


@pytest.mark.skipif(not _URL.startswith("postgres"), reason="нужен TEST_DATABASE_URL=postgresql://...")
def test_models_match_migrated_schema():
    engine = _engine()
    try:
        problems = [f"нет в БД: {m}" for m in missing_schema(engine)]

        insp = inspect(engine)
        db_tables = set(insp.get_table_names())
        for table in Base.metadata.sorted_tables:
            if table.name not in db_tables:
                continue  # уже в problems
            db_cols = {c["name"]: c for c in insp.get_columns(table.name)}
            for col in table.columns:
                key = f"{table.name}.{col.name}"
                db_col = db_cols.get(col.name)
                if db_col is None or key in KNOWN_NULLABILITY_DRIFT:
                    continue
                if bool(col.nullable) != bool(db_col["nullable"]):
                    problems.append(
                        f"NULL расходится: {key} (модель nullable={bool(col.nullable)}, БД nullable={db_col['nullable']})"
                    )

        extra_tables = sorted(db_tables - set(Base.metadata.tables))
        if extra_tables:
            print("В БД есть таблицы вне моделей:", ", ".join(extra_tables))

        assert not problems, "Дрейф моделей и SQL-миграций:\n  " + "\n  ".join(problems)
    finally:
        engine.dispose()
