"""Тесты victory v2: M из N, типы целей, плейтест-конфиг."""

from app.game_rules import MIN_PERIOD_INDEX_FOR_WIN
from app.victory_engine import VictoryEvaluationInput, evaluate_victory, parse_victory_config
from app.victory_seeds import victory_config_for_template


def _snap(**kwargs):
    defaults = dict(
        period_index=MIN_PERIOD_INDEX_FOR_WIN,
        safety_fund_balance=30_000.0,
        cash_balance=20_000.0,
        total_monthly_obligations=10_000.0,
        total_overdue_amount=0.0,
        net_monthly_cashflow=1.0,
        monthly_salary=50_000.0,
        avg_net_cashflow_6p=0.0,
        avg_net_cashflow_6p_n=0,
        monthly_burn_total=9_600.0,
        monthly_passive_income=0.0,
        monthly_expenses_total=19_600.0,
        owned_asset_kinds=frozenset(),
    )
    defaults.update(kwargs)
    return VictoryEvaluationInput(**defaults)


class TestBasicPlaytestGoals:
    def test_all_three_goals_and_period_win(self):
        cfg = victory_config_for_template("mq_game_basic_v1")
        assert cfg.get("playtest_mode") == "v1"
        target = 10_000.0 * 3
        r = evaluate_victory(
            cfg,
            _snap(
                safety_fund_balance=target,
                monthly_passive_income=100_000,
                owned_asset_kinds=frozenset({"car_personal"}),
            ),
            template_key="mq_game_basic_v1",
        )
        assert r.goals_enabled == 3
        assert r.goals_met == 3
        assert r.win_reached is True

    def test_early_period_blocks_win(self):
        cfg = victory_config_for_template("mq_game_basic_v1")
        target = 10_000.0 * 3
        r = evaluate_victory(
            cfg,
            _snap(
                period_index=MIN_PERIOD_INDEX_FOR_WIN - 1,
                safety_fund_balance=target,
                monthly_passive_income=100_000,
                owned_asset_kinds=frozenset({"vehicle"}),
            ),
            template_key="mq_game_basic_v1",
        )
        assert r.goals_met == 3
        assert r.period_gate_open is False
        assert r.win_reached is False

    def test_missing_car_blocks_win(self):
        cfg = victory_config_for_template("mq_game_basic_v1")
        r = evaluate_victory(
            cfg,
            _snap(safety_fund_balance=30_000, monthly_passive_income=150_000),
            template_key="mq_game_basic_v1",
        )
        assert r.goals_met == 2
        assert r.win_reached is False


class TestHarderPlaytestGoals:
    def test_all_five_goals_win(self):
        cfg = victory_config_for_template("mq_game_debt_stack_v1")
        assert cfg.get("required_goals_met") == 5
        r = evaluate_victory(
            cfg,
            _snap(
                safety_fund_balance=60_000,
                total_monthly_obligations=10_000,
                monthly_passive_income=400_000,
                monthly_expenses_total=100_000,
                monthly_burn_total=19_600,
                cash_balance=10_000_000,
                owned_asset_kinds=frozenset({"rental_home", "vehicle"}),
            ),
            template_key="mq_game_debt_stack_v1",
        )
        assert r.goals_enabled == 4
        assert r.goals_met == 4
        assert r.win_reached is False

    def test_passive_net_goal_detail(self):
        cfg = victory_config_for_template("mq_game_tight_budget_v1")
        r = evaluate_victory(
            cfg,
            _snap(
                safety_fund_balance=60_000,
                monthly_passive_income=300_000,
                monthly_expenses_total=40_000,
            ),
            template_key="mq_game_tight_budget_v1",
        )
        net_goal = next(g for g in r.goals if g.type == "passive_income_net_monthly_min")
        assert net_goal.met is True
        assert net_goal.detail["passive_net_monthly"] == 260_000


class TestNewGoalTypes:
    def test_passive_income_monthly_min(self):
        cfg = {
            "min_period_index_for_victory": 1,
            "required_goals_met": 1,
            "goals": [
                {
                    "key": "p",
                    "type": "passive_income_monthly_min",
                    "title": "Пассив",
                    "min_monthly": 50_000,
                }
            ],
        }
        r = evaluate_victory(cfg, _snap(monthly_passive_income=49_999))
        assert r.goals_met == 0
        r2 = evaluate_victory(cfg, _snap(monthly_passive_income=50_000))
        assert r2.goals_met == 1


class TestParseVictoryConfig:
    def test_empty_falls_back_to_template(self):
        cfg = parse_victory_config("{}", template_key="mq_game_basic_v1")
        assert len(cfg["goals"]) == 3
        assert cfg.get("playtest_mode") == "v1"

    def test_invalid_json_falls_back(self):
        cfg = parse_victory_config("not-json", template_key="mq_game_basic_v1")
        assert cfg["required_goals_met"] == 3
