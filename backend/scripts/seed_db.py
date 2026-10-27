#!/usr/bin/env python3
"""
Bootstrap seeds for empty or dev DB (idempotent).

Usage (bash):
  export DATABASE_URL="postgresql://..."
  python backend/scripts/seed_db.py
"""

from __future__ import annotations

from app.database import SessionLocal, engine
from app.db_schema import prepare_schema
from app.seeds.runner import seed_all


def main() -> None:
    # PostgreSQL: схема — db.sh migrate (PR-08); здесь только сверка. SQLite — create_all.
    prepare_schema(engine)
    db = SessionLocal()
    try:
        seed_all(db)
        db.commit()
        print("[OK] Seeds applied")
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()

