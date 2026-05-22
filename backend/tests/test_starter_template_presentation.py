from app.starter_template_presentation import (
    compare_note_from_blueprint,
    highlights_from_blueprint,
    scenario_icon_from_blueprint,
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
    assert any("Доход" in x and ("45" in x or "45 000" in x) for x in lines)
    assert any("Авто" in x for x in lines)
    assert any("Кредит" in x for x in lines)


def test_scenario_icon_and_compare_fallback():
    bp = {}
    assert scenario_icon_from_blueprint(bp, "mq_game_debt_stack_v1") == "debt_stack"
    note = compare_note_from_blueprint(bp, "mq_game_debt_stack_v1") or ""
    assert "драйв" in note.lower()
