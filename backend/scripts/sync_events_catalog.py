#!/usr/bin/env python3
"""
Sync events catalog (MVP 1.1) from YAML canon into PostgreSQL (idempotent).

Usage (bash):
  export DATABASE_URL="postgresql://..."
  python backend/scripts/sync_events_catalog.py

Note: запускай из корня репо; скрипт сам добавит `backend/` в sys.path.
"""

from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]  # backend/
sys.path.insert(0, str(ROOT))

from app.database import SessionLocal
from app.events.mvp11_seeds import ensure_mvp11_event_catalog


def main() -> None:
    db = SessionLocal()
    try:
        ensure_mvp11_event_catalog(db)
        db.commit()
        print("[OK] Events catalog synced (mvp11)")
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()

