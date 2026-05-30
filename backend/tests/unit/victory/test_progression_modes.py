"""
CS: Victory v2 — chain vs parallel (backlog #3).

Gate: G4 инвариант победы; контракт progression_mode по template_key.
"""

from __future__ import annotations

import pytest

from app.game.rules import MIN_PERIOD_INDEX_FOR_WIN
from app.victory.engine import PROGRESSION_CHAIN, PROGRESSION_PARALLEL, evaluate_victory
from app.victory.seeds import (
    VICTORY_CONFIG_BY_TEMPLATE_KEY,
    VICTORY_CONFIG_LEGACY_BY_TEMPLATE_KEY,
    victory_config_for_template,
)
from tests.fixtures.victory import (
    base_victory_snap,
    skipped_middle_snap,
    three_step_config,
)


pytestmark = pytest.mark.unit


class TestChainVsParallelSemantics:
    def test_chain_blocks_later_steps_when_middle_missing(self):
        cfg = three_step_config(progression_mode=PROGRESSION_CHAIN, required_goals_met=3)
        result = evaluate_victory(cfg, skipped_middle_snap(), template_key="mq_game_basic_v1")

        assert result.progression_mode == PROGRESSION_CHAIN
        assert result.goals_met == 1
        assert result.goals_required == 3
        assert result.win_reached is False
        assert result.current_goal_key == "step_b"

        step_c = next(g for g in result.goals if g.key == "step_c")
        assert step_c.detail.get("raw_met") is True
        assert step_c.met is False

    def test_parallel_counts_m_of_n_without_order(self):
        cfg = three_step_config(progression_mode=PROGRESSION_PARALLEL, required_goals_met=2)
        result = evaluate_victory(cfg, skipped_middle_snap(), template_key="mq_game_basic_v1")

        assert result.progression_mode == PROGRESSION_PARALLEL
        assert result.goals_met == 2
        assert result.goals_required == 2
        assert result.win_reached is True
        assert result.current_goal_key == "step_b"

    def test_chain_win_requires_all_enabled_steps_and_period_gate(self):
        cfg = three_step_config(progression_mode=PROGRESSION_CHAIN, required_goals_met=3)
        snap = skipped_middle_snap(
            has_active_deposit=True,
            period_index=MIN_PERIOD_INDEX_FOR_WIN,
        )
        result = evaluate_victory(cfg, snap, template_key="mq_game_basic_v1")

        assert result.goals_met == 3
        assert result.win_reached is True

    def test_chain_early_period_blocks_win_even_when_steps_met(self):
        cfg = three_step_config(progression_mode=PROGRESSION_CHAIN, required_goals_met=3)
        snap = skipped_middle_snap(
            has_active_deposit=True,
            period_index=MIN_PERIOD_INDEX_FOR_WIN - 1,
        )
        result = evaluate_victory(cfg, snap, template_key="mq_game_basic_v1")

        assert result.goals_met == 3
        assert result.period_gate_open is False
        assert result.win_reached is False
        assert result.win_ready is True


class TestVictoryConfigByTemplateKey:
    def test_prod_templates_use_chain_mode(self):
        for template_key, cfg in VICTORY_CONFIG_BY_TEMPLATE_KEY.items():
            assert cfg.get("progression_mode") == PROGRESSION_CHAIN, template_key
            assert len(cfg.get("goals") or []) >= 5, template_key

    def test_legacy_templates_use_parallel_mode(self):
        for template_key, cfg in VICTORY_CONFIG_LEGACY_BY_TEMPLATE_KEY.items():
            assert cfg.get("progression_mode") == PROGRESSION_PARALLEL, template_key

    def test_mq_game_basic_v1_chain_goal_count(self):
        cfg = victory_config_for_template("mq_game_basic_v1")
        assert cfg.get("playtest_mode") == "tutorial"
        assert cfg["required_goals_met"] == len(cfg["goals"])

    def test_debt_stack_finale_goal_type(self):
        cfg = victory_config_for_template("mq_game_debt_stack_v1")
        assert cfg["goals"][-1]["key"] == "cash_10m"
        assert cfg["goals"][-1]["type"] == "cash_balance_min"
