"""Тесты victory: учебная цепочка (tutorial) и parallel (legacy)."""

from app.game_rules import MIN_PERIOD_INDEX_FOR_WIN
from app.mechanics_progression import TEMPLATE_MECHANICS_UNLOCK_PRESETS
from app.starter_mechanics import BASIC_V1_MECHANICS
from app.victory_engine import (
    PROGRESSION_CHAIN,
    VictoryEvaluationInput,
    evaluate_victory,
    parse_victory_config,
)
from app.victory_seeds import VICTORY_CONFIG_LEGACY_BY_TEMPLATE_KEY, victory_config_for_template

BASIC_UNLOCK = TEMPLATE_MECHANICS_UNLOCK_PRESETS["mq_game_basic_v1"]


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
        salary_ever_claimed=False,
        safety_ever_contributed=False,
        has_active_deposit=False,
        has_active_bond=False,
    )
    defaults.update(kwargs)
    return VictoryEvaluationInput(**defaults)


def _eval_basic(snap, **cfg_overrides):
    cfg = victory_config_for_template("mq_game_basic_v1")
    cfg = {**cfg, **cfg_overrides}
    return evaluate_victory(
        cfg,
        snap,
        template_key="mq_game_basic_v1",
        template_cap=BASIC_V1_MECHANICS,
        mechanics_unlock=BASIC_UNLOCK,
    )


def _tutorial_complete_snap(**kwargs):
    target = 10_000.0 * 3
    defaults = dict(
        salary_ever_claimed=True,
        safety_ever_contributed=True,
        safety_fund_balance=target,
        net_monthly_cashflow=1.0,
        total_overdue_amount=0.0,
        has_active_deposit=True,
        monthly_passive_income=20_000.0,
    )
    defaults.update(kwargs)
    return _snap(**defaults)


class TestBasicTutorialChain:
    def test_config_is_tutorial_chain(self):
        cfg = victory_config_for_template("mq_game_basic_v1")
        assert cfg.get("playtest_mode") == "tutorial"
        assert cfg.get("progression_mode") == PROGRESSION_CHAIN
        assert len(cfg["goals"]) == 6

    def test_starts_at_tutorial_salary(self):
        r = _eval_basic(_snap())
        assert r.current_goal_key == "tutorial_salary"
        assert r.goals_met == 0
        assert r.mechanics_effective["capital_invest"] is False

    def test_invest_goal_unavailable_until_cushion_done(self):
        r = _eval_basic(
            _snap(
                salary_ever_claimed=True,
                safety_ever_contributed=False,
                monthly_passive_income=50_000,
            )
        )
        invest = next(g for g in r.goals if g.key == "tutorial_invest")
        assert invest.available is False
        assert invest.blocked_reason
        passive = next(g for g in r.goals if g.key == "invest_income_15k")
        assert passive.available is False

    def test_invest_unlocks_after_tutorial_cushion_met(self):
        r = _eval_basic(
            _snap(
                salary_ever_claimed=True,
                safety_ever_contributed=True,
                net_monthly_cashflow=1.0,
            )
        )
        assert r.mechanics_effective["capital_invest"] is True
        invest = next(g for g in r.goals if g.key == "tutorial_invest")
        assert invest.available is True

    def test_passive_early_does_not_count_until_prior_steps(self):
        r = _eval_basic(
            _snap(
                salary_ever_claimed=True,
                safety_ever_contributed=True,
                safety_fund_balance=5_000.0,
                monthly_passive_income=50_000,
                net_monthly_cashflow=-100.0,
            )
        )
        passive = next(g for g in r.goals if g.key == "invest_income_15k")
        assert passive.detail.get("raw_met") is True
        assert passive.met is False
        assert r.current_goal_key == "flow_nonneg"

    def test_all_six_chain_and_period_win(self):
        r = _eval_basic(_tutorial_complete_snap())
        assert r.goals_enabled == 6
        assert r.goals_met == 6
        assert r.goals_required == 6
        assert r.current_goal_key is None
        assert r.win_reached is True

    def test_early_period_blocks_win(self):
        r = _eval_basic(_tutorial_complete_snap(period_index=MIN_PERIOD_INDEX_FOR_WIN - 1))
        assert r.goals_met == 6
        assert r.period_gate_open is False
        assert r.win_reached is False
        assert r.win_ready is True

    def test_action_once_salary(self):
        r = _eval_basic(_snap(salary_ever_claimed=True))
        salary = next(g for g in r.goals if g.key == "tutorial_salary")
        assert salary.met is True
        assert r.current_goal_key == "tutorial_cushion"


class TestHarderGoalChain:
    def test_all_four_goals_win(self):
        cfg = victory_config_for_template("mq_game_debt_stack_v1")
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
        assert r.win_reached is True


class TestNewGoalTypes:
    def test_passive_income_monthly_min_parallel(self):
        cfg = {
            "min_period_index_for_victory": 1,
            "required_goals_met": 1,
            "progression_mode": "parallel",
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

    def test_action_once_invest_opened(self):
        cfg = {
            "min_period_index_for_victory": 1,
            "progression_mode": "parallel",
            "goals": [
                {
                    "key": "inv",
                    "type": "action_once",
                    "title": "Инвест",
                    "action": "invest_opened",
                }
            ],
        }
        r = evaluate_victory(cfg, _snap(has_active_bond=True))
        assert r.goals[0].met is True


class TestParseVictoryConfig:
    def test_empty_falls_back_to_template(self):
        cfg = parse_victory_config("{}", template_key="mq_game_basic_v1")
        assert len(cfg["goals"]) == 6
        assert cfg.get("playtest_mode") == "tutorial"
        assert cfg.get("progression_mode") == PROGRESSION_CHAIN

    def test_invalid_json_falls_back(self):
        cfg = parse_victory_config("not-json", template_key="mq_game_basic_v1")
        assert cfg["required_goals_met"] == 6

    def test_legacy_parallel_mode(self):
        cfg = VICTORY_CONFIG_LEGACY_BY_TEMPLATE_KEY["mq_game_basic_v1"]
        r = evaluate_victory(
            cfg,
            _tutorial_complete_snap(monthly_passive_income=0, has_active_deposit=False),
            template_key="mq_game_basic_v1",
        )
        assert r.progression_mode == "parallel"
        assert r.goals_met >= 2
