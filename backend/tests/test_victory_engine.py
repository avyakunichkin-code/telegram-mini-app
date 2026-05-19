"""Тесты victory v2: M из N, типы целей, эквивалент MVP на basic config."""

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
        character_level=1,
        monthly_salary=50_000.0,
        avg_net_cashflow_6p=0.0,
        avg_net_cashflow_6p_n=0,
    )
    defaults.update(kwargs)
    return VictoryEvaluationInput(**defaults)


class TestBasicTemplateMvpEquivalent:
    def test_all_three_goals_and_period_win(self):
        cfg = victory_config_for_template("mq_game_basic_v1")
        target = 10_000.0 * 3
        r = evaluate_victory(
            cfg,
            _snap(safety_fund_balance=target, net_monthly_cashflow=0),
            template_key="mq_game_basic_v1",
        )
        assert r.goals_enabled == 4
        assert r.goals_met == 4
        assert r.win_reached is True

    def test_early_period_blocks_win(self):
        cfg = victory_config_for_template("mq_game_basic_v1")
        target = 10_000.0 * 3
        r = evaluate_victory(
            cfg,
            _snap(period_index=MIN_PERIOD_INDEX_FOR_WIN - 1, safety_fund_balance=target),
            template_key="mq_game_basic_v1",
        )
        assert r.goals_met == 4
        assert r.period_gate_open is False
        assert r.win_reached is False

    def test_two_of_three_not_enough(self):
        cfg = victory_config_for_template("mq_game_basic_v1")
        r = evaluate_victory(
            cfg,
            _snap(safety_fund_balance=30_000, total_overdue_amount=100, net_monthly_cashflow=-1),
            template_key="mq_game_basic_v1",
        )
        assert r.goals_met == 2
        assert r.win_reached is False


class TestHarderTemplateMofN:
    def test_three_of_five_wins(self):
        cfg = victory_config_for_template("mq_game_debt_stack_v1")
        r = evaluate_victory(
            cfg,
            _snap(
                safety_fund_balance=60_000,
                total_overdue_amount=0,
                net_monthly_cashflow=1,
                character_level=5,
                cash_balance=5_000,
                avg_net_cashflow_6p=0,
            ),
            template_key="mq_game_debt_stack_v1",
        )
        assert r.goals_enabled == 6
        assert r.goals_met >= 3
        assert r.win_reached is True

    def test_avg_liquid_requires_samples_and_salary_threshold(self):
        cfg = victory_config_for_template("mq_game_tight_budget_v1")
        r = evaluate_victory(
            cfg,
            _snap(
                safety_fund_balance=60_000,
                total_overdue_amount=0,
                net_monthly_cashflow=1,
                character_level=5,
                cash_balance=20_000,
                monthly_salary=40_000,
                avg_net_cashflow_6p=250_000,
                avg_net_cashflow_6p_n=3,
            ),
            template_key="mq_game_tight_budget_v1",
        )
        avg_goal = next(g for g in r.goals if g.type == "avg_liquid_delta_6p")
        assert avg_goal.met is True
        assert r.goals_met >= 3


class TestParseVictoryConfig:
    def test_empty_falls_back_to_template(self):
        cfg = parse_victory_config("{}", template_key="mq_game_basic_v1")
        assert len(cfg["goals"]) == 4

    def test_invalid_json_falls_back(self):
        cfg = parse_victory_config("not-json", template_key="mq_game_basic_v1")
        assert cfg["required_goals_met"] == 3
