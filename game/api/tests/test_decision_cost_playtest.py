"""DC-06 measurement: distinguish ranking from diversity, and restore missed income."""
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
from decision_cost_playtest import capture_candidates, compare_selection
from app.models import PeriodEconomyClosing
from tests.fixtures.game import create_profile_ready_for_period_close


def test_average_income_restores_missed_salary_without_lowering_threshold(db_session, test_user):
    profile = create_profile_ready_for_period_close(db_session, user_id=test_user.id,
                                                  salary_already_claimed=False, period_index=2)
    db_session.add(PeriodEconomyClosing(game_profile_id=profile.id, period_index=1, period_income_rate=0))
    db_session.commit()
    audit = capture_candidates(db_session, profile, "defeat", 1)
    assert audit["closed_turns"] == 1
    assert audit["received_regular_income"] == 0
    assert audit["average_available_income"] == pytest.approx(50000)
    assert audit["missed_salary_estimate"] == pytest.approx(50000)


def test_diversity_replacement_is_reported_without_lowering_threshold():
    def c(kind, direction, amount):
        return {"kind": kind, "direction": direction, "amount": amount}
    audit = {"average_available_income": 10, "candidates": [
        c("debt_overpaid", "cost", 300), c("salary_missed", "cost", 200),
        c("event_cost", "cost", 150), c("investment_gain", "gain", 20),
    ]}
    ranked = compare_selection(audit, 1, False)
    mixed = compare_selection(audit, 1, True)
    assert ranked["investment_status"] == "displaced_by_larger_amounts"
    assert mixed["investment_status"] == "selected"
    assert mixed["diversity_replacement"]["removed"]["amount"] == 150
    assert compare_selection(audit, 3, True)["investment_status"] == "below_threshold"
    assert compare_selection({"average_available_income": 0}, 1, True)["eligible"] is False
