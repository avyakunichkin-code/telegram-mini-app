#!/usr/bin/env python3
"""
Bootstrap seeds for empty or dev DB (idempotent).

Usage (bash):
  export DATABASE_URL="postgresql://..."
  python backend/scripts/seed_db.py
"""

from __future__ import annotations

from app.database import Base, SessionLocal, engine
from app.seeds.runner import seed_all


def main() -> None:
    Base.metadata.create_all(bind=engine)
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

