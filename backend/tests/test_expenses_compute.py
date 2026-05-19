"""Тесты домена расходов на жизнеобеспечение (E1)."""

from __future__ import annotations

import json

import pytest

from app.expense_template_defaults import expense_budget_for_template
from app.expenses import (
    compute_monthly_burn,
    ensure_expense_category_catalog,
    seed_expense_lines_from_budget,
)
from app.models import GameProfile, GameStarterTemplate


@pytest.fixture()
def profile_with_budget(db_session):
    ensure_expense_category_catalog(db_session)
    profile = GameProfile(
        user_id=1,
        name="Burn test",
        save_kind="game",
        starter_template_key="mq_game_basic_v1",
        base_monthly_lifestyle_expense=9600.0,
        delta_monthly_lifestyle_expense=0,
        is_active=1,
        period_index=1,
        cash_balance=10000,
        safety_fund_balance=0,
    )
    db_session.add(profile)
    db_session.commit()
    db_session.refresh(profile)

    budget = expense_budget_for_template("mq_game_basic_v1", 9600.0, {})
    seed_expense_lines_from_budget(
        db_session,
        profile,
        budget,
        period_index=1,
        source_kind="template",
        source_ref="mq_game_basic_v1",
    )
    db_session.commit()
    return profile


def test_expense_budget_sums_to_base():
    budget = expense_budget_for_template("mq_game_basic_v1", 9600.0, {})
    assert sum(budget.values()) == pytest.approx(9600.0, abs=0.02)
    assert budget["housing"] > 0
    assert budget["food"] > 0


def test_compute_monthly_burn_from_lines(db_session, profile_with_budget):
    snap = compute_monthly_burn(db_session, profile_with_budget)
    assert snap.total == pytest.approx(9600.0, abs=0.02)
    assert snap.lines_sum == pytest.approx(9600.0, abs=0.02)
    assert len(snap.lines) >= 5
    assert len(snap.by_category) >= 5


def test_legacy_delta_added_to_lines(db_session, profile_with_budget):
    profile_with_budget.delta_monthly_lifestyle_expense = 400.0
    db_session.commit()
    snap = compute_monthly_burn(db_session, profile_with_budget)
    assert snap.total == pytest.approx(10000.0, abs=0.02)
    assert snap.legacy_delta == 400.0


def test_backfill_from_base_when_no_lines(db_session):
    ensure_expense_category_catalog(db_session)
    db_session.add(
        GameStarterTemplate(
            template_key="mq_game_basic_v1",
            title="Базовый",
            difficulty_rank=1,
            base_monthly_lifestyle_expense=9600.0,
            blueprint_json=json.dumps({"expense_budget": expense_budget_for_template("mq_game_basic_v1", 9600.0, {})}),
            victory_config_json="{}",
            is_active=1,
            sort_order=10,
        )
    )
    profile = GameProfile(
        user_id=1,
        name="Backfill",
        save_kind="game",
        starter_template_key="mq_game_basic_v1",
        base_monthly_lifestyle_expense=9600.0,
        is_active=1,
        period_index=1,
        cash_balance=5000,
    )
    db_session.add(profile)
    db_session.commit()

    snap = compute_monthly_burn(db_session, profile)
    assert snap.total == pytest.approx(9600.0, abs=0.02)
    assert len(snap.lines) >= 5


def test_victory_expense_to_income_ratio_goal():
    from app.victory_engine import VictoryEvaluationInput, evaluate_victory, parse_victory_config

    cfg = parse_victory_config(
        {
            "schema_version": 1,
            "min_period_index": 1,
            "goals_required": 1,
            "goals": [
                {
                    "key": "burn_ratio",
                    "type": "expense_to_income_ratio",
                    "title": "Расходы ≤ 50% дохода",
                    "max_ratio": 0.5,
                    "required": True,
                }
            ],
        },
        template_key="test",
    )
    ok = evaluate_victory(
        cfg,
        VictoryEvaluationInput(
            period_index=7,
            safety_fund_balance=0,
            cash_balance=10000,
            total_monthly_obligations=0,
            total_overdue_amount=0,
            net_monthly_cashflow=10000,
            character_level=1,
            monthly_salary=50000,
            monthly_burn_total=20000,
            avg_net_cashflow_6p=0,
            avg_net_cashflow_6p_n=0,
        ),
        template_key="test",
    )
    assert ok.goals[0].met is True

    bad = evaluate_victory(
        cfg,
        VictoryEvaluationInput(
            period_index=7,
            safety_fund_balance=0,
            cash_balance=10000,
            total_monthly_obligations=0,
            total_overdue_amount=0,
            net_monthly_cashflow=10000,
            character_level=1,
            monthly_salary=50000,
            monthly_burn_total=30000,
            avg_net_cashflow_6p=0,
            avg_net_cashflow_6p_n=0,
        ),
        template_key="test",
    )
    assert bad.goals[0].met is False
