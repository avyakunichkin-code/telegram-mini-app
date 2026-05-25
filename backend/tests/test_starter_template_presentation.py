from app.starter_template_presentation import (
    compare_note_from_blueprint,
    highlights_from_blueprint,
    scenario_icon_from_blueprint,
    scenario_picker_highlights,
)


def test_highlights_explicit_in_blueprint():
    bp = {
        "highlights": ["А", "Б"],
        "monthly_salary": 99999,
    }
    assert highlights_from_blueprint(bp) == ["А", "Б"]


def test_highlights_derived_from_assets_and_liabilities():
    bp = {
        "monthly_salary": 45000,
        "cash_balance": 9000,
        "assets": [{"title": "Авто", "monthly_maintenance_cost": 3000}],
        "liabilities": [{"title": "Кредит"}],
    }
    lines = highlights_from_blueprint(bp, base_monthly_lifestyle_expense=14800)
    assert any("Зарплата" in x and ("45" in x or "45 000" in x) for x in lines)
    assert any("Авто" in x for x in lines)
    assert any("Кредит" in x for x in lines)


def test_scenario_icon_and_compare_fallback():
    bp = {}
    assert scenario_icon_from_blueprint(bp, "mq_game_debt_stack_v1") == "factory"
    note = compare_note_from_blueprint(bp, "mq_game_debt_stack_v1") or ""
    assert "драйв" in note.lower()


def test_scenario_picker_highlights_salary_and_tiers():
    basic = {
        "monthly_salary": 62500,
        "mechanics_unlock": [
            {"after_goal": None, "grant": ["capital_flows"]},
            {"after_goal": "tutorial_cushion", "grant": ["capital_invest"]},
        ],
    }
    lines = scenario_picker_highlights(basic, "mq_game_basic_v1")
    assert lines[0].startswith("Зарплата")
    assert "депозит" in lines[1].lower()

    pro = {
        "monthly_salary": 100000,
        "mechanics_unlock": [
            {"after_goal": None, "grant": ["capital_flows"]},
            {"after_goal": "tutorial_cushion", "grant": ["capital_liabilities"]},
            {"after_goal": "safety_6x", "grant": ["capital_invest"]},
            {"after_goal": "tutorial_invest", "grant": ["capital_insurance"]},
            {"after_goal": "tutorial_insurance", "grant": ["capital_property"]},
        ],
    }
    from app.starter_template_presentation import granted_capital_mechanics_from_blueprint

    prev = granted_capital_mechanics_from_blueprint(basic, "mq_game_basic_v1")
    pro_lines = scenario_picker_highlights(
        pro, "mq_game_tight_budget_v1", previous_granted=prev
    )
    assert pro_lines[0].startswith("Зарплата")
    assert pro_lines[1].startswith("Ещё:")
