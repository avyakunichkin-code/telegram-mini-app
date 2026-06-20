from __future__ import annotations

"""
Seed runner (идемпотентный).

Правило проекта:
- migrations/baseline = DDL-only
- наполнение справочников/каталогов = seeds (upsert) в коде
"""

from sqlalchemy.orm import Session

from app.finance.expenses import ensure_expense_category_catalog
from app.events.mvp11_seeds import ensure_mvp11_event_catalog
from app.seeds.capital_catalog import upsert_capital_asset_catalog, upsert_capital_liability_catalog
from app.seeds.game_starter_templates import upsert_game_starter_templates
from app.seeds.victory_goals import upsert_victory_goals


def seed_reference_data(db: Session) -> None:
    """
    Справочники/каталоги, без которых UI/игра не стартует корректно.
    Должно быть безопасно запускать при каждом старте API.
    """
    ensure_expense_category_catalog(db)


def seed_catalogs(db: Session) -> None:
    """
    Каталоги “почти-справочники”: шаблоны стартов, шаблоны капитала и т.п.
    """
    upsert_game_starter_templates(db)
    upsert_capital_asset_catalog(db)
    upsert_capital_liability_catalog(db)
    upsert_victory_goals(db)


def seed_events(db: Session) -> None:
    """
    Канон контента: data/events/mvp11/*.yaml → синк в PostgreSQL.
    Идемпотентно: безопасно вызывать на каждом старте API.
    """
    ensure_mvp11_event_catalog(db)


def seed_all(db: Session) -> None:
    """
    Полный набор сидов для bootstrap окружения.
    Идемпотентно: можно безопасно вызывать на каждом старте.
    """
    seed_reference_data(db)
    seed_catalogs(db)
    seed_events(db)
