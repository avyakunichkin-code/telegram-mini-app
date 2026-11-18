"""Экономика закрытия периода и превью читают долги, активы, полисы, вклады и статьи в порядке `id`.

При нехватке денег порядок долгов решает, какой уйдёт в просрочку. SQLite отдаёт строки
в порядке вставки, поэтому golden-тесты не заметят пропажу ORDER BY; на PostgreSQL порядок
без него не гарантирован. Тест проверяет сам SQL.
"""

from __future__ import annotations

import json
import re
from unittest.mock import patch

import pytest
from sqlalchemy import event

from app.finance.period_close_preview import estimate_period_close_preview
from app.game.period import process_period_end
from app.models import FinanceAsset, GameStarterTemplate, InsurancePolicy, InvestmentPosition, ProfileExpenseLine
from tests.fixtures.game import create_finance_liability, create_profile_ready_for_period_close
from tests.test_character_needs import _patch_template_needs

ORDERED_TABLES = (
    "finance_liabilities",
    "finance_assets",
    "insurance_policies",
    "investment_positions",
    "profile_expense_lines",
)


@pytest.fixture()
def profile(db_session, test_user, seed_basic_template):
    # Потребности на модели set_point: этап потребностей в закрытии тоже читает активы и статьи.
    _patch_template_needs(db_session)
    tmpl = db_session.query(GameStarterTemplate).filter(GameStarterTemplate.template_key == "mq_game_basic_v1").one()
    blueprint = json.loads(tmpl.blueprint_json)
    blueprint["needs"]["model"] = "set_point"
    tmpl.blueprint_json = json.dumps(blueprint, ensure_ascii=False)
    db_session.commit()

    profile = create_profile_ready_for_period_close(
        db_session, user_id=test_user.id, cash_balance=1_000.0,
        need_comfort=50.0, need_status=50.0, need_social=50.0, need_health=50.0,
    )
    pid = profile.id
    create_finance_liability(db_session, pid, title="Первый")
    create_finance_liability(db_session, pid, title="Второй")
    db_session.add_all(
        [
            FinanceAsset(game_profile_id=pid, title="Машина", kind="car", asset_value=1.0,
                         monthly_maintenance_cost=100.0),
            InsurancePolicy(game_profile_id=pid, kind="health", title="ДМС", monthly_premium=10.0,
                            started_period_index=0, expires_period_index=12),
            InvestmentPosition(game_profile_id=pid, kind="deposit", title="Вклад", principal=1_000.0,
                               annual_rate_percent=10.0, started_period=1, last_accrued_period=0),
            ProfileExpenseLine(game_profile_id=pid, category_key="food", amount_monthly=500.0,
                               created_period_index=1),
            ProfileExpenseLine(game_profile_id=pid, category_key="leisure", amount_monthly=300.0,
                               created_period_index=1, source_kind="event"),
        ]
    )
    db_session.commit()
    return profile


def _row_selects(db_session, action) -> dict[str, list[str]]:
    """SELECT строк (не агрегатов) по таблицам из ORDERED_TABLES, выполненные внутри action."""
    captured: list[str] = []

    def before(conn, cursor, statement, parameters, context, executemany):
        captured.append(statement)

    engine = db_session.get_bind()
    event.listen(engine, "before_cursor_execute", before)
    try:
        action()
    finally:
        event.remove(engine, "before_cursor_execute", before)

    by_table: dict[str, list[str]] = {t: [] for t in ORDERED_TABLES}
    for sql in captured:
        flat = " ".join(sql.split())
        if not flat.startswith("SELECT") or "count(" in flat.lower():
            continue
        match = re.search(r"\bFROM (\w+)", flat)
        if not match or match.group(1) not in by_table:
            continue
        table = match.group(1)
        if re.search(rf"WHERE {table}\.id = \?", flat):
            continue  # одна строка по первичному ключу (get / refresh / lazy load)
        by_table[table].append(flat)
    return by_table


def _assert_ordered_by_id(by_table: dict[str, list[str]], tables) -> None:
    for table in tables:
        assert by_table[table], f"нет выборки из {table}"
        for sql in by_table[table]:
            assert f"ORDER BY {table}.id" in sql, sql


def test_period_close_reads_rows_in_id_order(db_session, profile):
    # Достижения и оповещения админам (через проверку победы) только суммируют и проверяют
    # наличие строк — порядок им не важен; проверяем экономику и потребности закрытия.
    with (
        patch("app.game.period.ensure_period_events", return_value=None),
        patch("app.game.period.process_achievement_unlocks", return_value=[]),
        patch("app.admin.notify.process_period_admin_alerts"),
    ):
        by_table = _row_selects(db_session, lambda: process_period_end(db_session, profile))
    assert len(by_table["finance_assets"]) >= 2, "этап потребностей (set_point) не читал активы"
    _assert_ordered_by_id(by_table, ORDERED_TABLES)


def test_preview_reads_rows_in_id_order(db_session, profile):
    by_table = _row_selects(db_session, lambda: estimate_period_close_preview(db_session, profile))
    _assert_ordered_by_id(by_table, ("finance_liabilities", "finance_assets", "insurance_policies",
                                     "profile_expense_lines"))
