"""
PR-08: один путь схемы — `bash backend/scripts/db.sh migrate`.

API на старте не пишет DDL в PostgreSQL: сверяет схему с ORM и падает с
подсказкой. Чтобы это было безопасно, SQL в `migrations/` обязан покрывать
каждую таблицу и колонку `app.models` — иначе новая колонка доедет до prod
только через забытый `ensure_schema`.
"""

from __future__ import annotations

import re
from pathlib import Path

import pytest
from sqlalchemy import Column, Integer, MetaData, String, Table, create_engine, inspect

from app.database import Base
from app.db_schema import SchemaOutOfDateError, missing_schema, prepare_schema


pytestmark = pytest.mark.unit

MIGRATIONS = Path(__file__).resolve().parents[1] / "migrations"

_CREATE = re.compile(
    r"CREATE TABLE(?: IF NOT EXISTS)?\s+(?:public\.)?\"?(\w+)\"?\s*\((.*?)\n\)", re.S | re.I
)
_ALTER = re.compile(r"ALTER TABLE(?: ONLY)?(?: IF EXISTS)?\s+(?:public\.)?\"?(\w+)\"?\s+(.*?);", re.S | re.I)
_NOT_COLUMN = {"CONSTRAINT", "PRIMARY", "UNIQUE", "FOREIGN", "CHECK"}


def _schema_from_migrations() -> dict[str, set[str]]:
    """Таблицы и колонки, которые даёт `db.sh migrate` (корень migrations/, по имени)."""
    schema: dict[str, set[str]] = {}
    for path in sorted(MIGRATIONS.glob("*.sql")):
        sql = path.read_text(encoding="utf-8")
        for m in _CREATE.finditer(sql):
            cols = schema.setdefault(m.group(1), set())
            for line in m.group(2).splitlines():
                head = re.match(r"\s*\"?(\w+)\"?\s+\w", line)
                if head and head.group(1).upper() not in _NOT_COLUMN:
                    cols.add(head.group(1))
        for m in _ALTER.finditer(sql):
            table, body = m.group(1), m.group(2)
            for col in re.findall(r"ADD COLUMN(?: IF NOT EXISTS)?\s+\"?(\w+)\"?", body, re.I):
                schema.setdefault(table, set()).add(col)
            for col in re.findall(r"DROP COLUMN(?: IF EXISTS)?\s+\"?(\w+)\"?", body, re.I):
                schema.get(table, set()).discard(col)
    return schema


def test_migrations_cover_every_orm_table_and_column():
    schema = _schema_from_migrations()
    gaps = [
        f"{table.name}.{col.name}" if table.name in schema else table.name
        for table in Base.metadata.sorted_tables
        for col in table.columns
        if table.name not in schema or col.name not in schema[table.name]
    ]
    assert not sorted(set(gaps)), (
        "ORM опередила SQL: добавь migrations/00NN_*.sql (ADD COLUMN IF NOT EXISTS) для "
        + ", ".join(sorted(set(gaps)))
    )


def test_migrations_create_victory_goals_catalog():
    # Таблица без ORM-модели: create_all её не создаст, только SQL.
    assert "victory_goals" in _schema_from_migrations()


def _engine(tmp_path):
    return create_engine(f"sqlite:///{tmp_path / 'schema.db'}")


def test_missing_schema_empty_when_db_matches_models(tmp_path):
    engine = _engine(tmp_path)
    Base.metadata.create_all(bind=engine)
    assert missing_schema(engine) == []


def test_missing_schema_reports_tables_and_columns(tmp_path):
    engine = _engine(tmp_path)
    Base.metadata.create_all(bind=engine)
    # Старая БД: users без новых колонок, game_profiles нет совсем.
    with engine.begin() as conn:
        conn.exec_driver_sql("DROP TABLE game_profiles")
        conn.exec_driver_sql("ALTER TABLE users DROP COLUMN telegram_started_at")

    missing = missing_schema(engine)
    assert "game_profiles" in missing
    assert "users.telegram_started_at" in missing


def test_prepare_schema_without_auto_create_fails_and_writes_no_ddl(tmp_path):
    engine = _engine(tmp_path)
    with pytest.raises(SchemaOutOfDateError) as exc:
        prepare_schema(engine, auto_create=False)
    assert "db.sh migrate" in str(exc.value)
    # Ничего не создано: схема — только через миграции.
    assert inspect(engine).get_table_names() == []


def test_prepare_schema_auto_create_for_sqlite(tmp_path):
    engine = _engine(tmp_path)
    prepare_schema(engine)  # SQLite по умолчанию — одноразовая БД e2e/sim
    assert missing_schema(engine) == []


def test_prepare_schema_ignores_extra_legacy_objects(tmp_path):
    engine = _engine(tmp_path)
    Base.metadata.create_all(bind=engine)
    legacy = MetaData()
    Table("legacy_table", legacy, Column("id", Integer, primary_key=True), Column("x", String(10)))
    legacy.create_all(bind=engine)
    prepare_schema(engine, auto_create=False)
