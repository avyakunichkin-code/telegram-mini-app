#!/usr/bin/env python3
"""
Снимок DDL для migrations/0000_schema_baseline.sql.

Режимы (по приоритету):
  1. pg_dump --schema-only (если в PATH и DATABASE_URL доступен с локальной машины)
  2. --from-migrations — SQLAlchemy models + склейка migrations/*.sql

Использование:
  cd backend
  python scripts/dump_schema_baseline.py
  python scripts/dump_schema_baseline.py --from-migrations
"""
from __future__ import annotations

import argparse
import os
import shutil
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MIGRATIONS = ROOT / "migrations"
OUT = MIGRATIONS / "0000_schema_baseline.sql"

sys.path.insert(0, str(ROOT))


def _header(source: str) -> str:
    stamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
    return f"""-- Schema baseline: ТВОЙ ХОД (PostgreSQL)
-- Generated: {stamp}
-- Source: {source}
-- Regenerate: python scripts/dump_schema_baseline.py
-- Apply empty DB: .\\migrate.ps1 -BaselineOnly
--
-- DDL only. Reference data: main.py seeds + data/events/mvp11 YAML sync.
--

"""


def _load_models_ddl() -> str:
    from sqlalchemy.dialects import postgresql
    from sqlalchemy.schema import CreateIndex, CreateTable

    from app.database import Base
    import app.models  # noqa: F401 — register metadata

    dialect = postgresql.dialect()
    chunks: list[str] = ["-- === Core schema (SQLAlchemy models / create_all) ===\n"]
    for table in Base.metadata.sorted_tables:
        chunks.append(str(CreateTable(table).compile(dialect=dialect)) + ";\n")
    for table in Base.metadata.sorted_tables:
        for index in table.indexes:
            chunks.append(str(CreateIndex(index).compile(dialect=dialect)) + ";\n")
    return "".join(chunks)


def _incremental_migrations_sql() -> str:
    files = sorted(MIGRATIONS.glob("*.sql"))
    files = [f for f in files if not f.name.startswith("0000_")]
    if not files:
        raise SystemExit("No incremental migrations found in migrations/")

    parts: list[str] = ["\n-- === Incremental migrations (idempotent ALTER/seed) ===\n"]
    for path in files:
        parts.append(f"-- >>> {path.name}\n")
        parts.append(path.read_text(encoding="utf-8").strip())
        parts.append("\n\n")
    return "".join(parts)


def dump_from_models_and_migrations() -> str:
    return _load_models_ddl() + _incremental_migrations_sql()


def dump_pg_dump(database_url: str) -> str | None:
    if not shutil.which("pg_dump"):
        return None
    try:
        proc = subprocess.run(
            [
                "pg_dump",
                database_url,
                "--schema-only",
                "--no-owner",
                "--no-privileges",
                "--no-tablespaces",
            ],
            capture_output=True,
            text=True,
            check=True,
            timeout=120,
        )
        return proc.stdout
    except (subprocess.CalledProcessError, OSError, subprocess.TimeoutExpired) as exc:
        print(f"[warn] pg_dump failed: {exc}", file=sys.stderr)
        return None


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate 0000_schema_baseline.sql")
    parser.add_argument(
        "--from-migrations",
        action="store_true",
        help="Skip pg_dump; models DDL + incremental SQL files",
    )
    args = parser.parse_args()

    body: str | None = None
    source = ""

    if not args.from_migrations:
        url = os.getenv("DATABASE_URL", "").strip()
        if url.startswith("postgresql://") or url.startswith("postgres://"):
            print("[info] Trying pg_dump …")
            body = dump_pg_dump(url)
            if body:
                source = "pg_dump --schema-only"
        else:
            print("[info] DATABASE_URL not set or not PostgreSQL — skip pg_dump")

    if body is None:
        print("[info] Building baseline from models + migrations/*.sql …")
        body = dump_from_models_and_migrations()
        source = "SQLAlchemy models + concat migrations/*.sql"

    OUT.write_text(_header(source) + body.strip() + "\n", encoding="utf-8")
    size_kb = OUT.stat().st_size // 1024
    print(f"[OK] {OUT.relative_to(ROOT)} ({size_kb} KiB)")
    print("Next: python scripts/verify_schema_baseline.py")
    print("      .\\migrate.ps1 -BaselineOnly  (empty PostgreSQL)")
    print("      .\\scripts\\archive_incremental_migrations.ps1 -Force")


if __name__ == "__main__":
    main()
