"""Weights must influence actual picks, not only the intermediate fatigue number."""
from types import SimpleNamespace

import pytest

from app.game.rules import EventProfileCounterSnapshot
from app.services.events.selection import _weighted_sample_without_replacement


@pytest.fixture
def equal_draw(monkeypatch):
    monkeypatch.setattr('app.services.events.selection.random.random', lambda: 0.5)


def definition(event_id, weight):
    return SimpleNamespace(id=event_id, weight=weight)


def test_larger_weight_wins_for_equal_random_draws(equal_draw):
    low, high = definition(1, 1), definition(2, 1000)
    assert _weighted_sample_without_replacement([low, high], 1) == [high]


def test_fatigue_reduces_actual_selection_priority(equal_draw):
    fresh, repeated = definition(1, 100), definition(2, 100)
    counters = {2: EventProfileCounterSnapshot(times_selected=4, last_selected_period_index=3)}
    assert _weighted_sample_without_replacement([fresh, repeated], 1, counter_map=counters) == [fresh]


def test_needs_rescue_multiplier_increases_actual_priority(equal_draw):
    ordinary, rescue = definition(1, 100), definition(2, 100)
    assert _weighted_sample_without_replacement(
        [ordinary, rescue], 1, counter_map={}, weight_multiplier_by_id={2: 10.0},
    ) == [rescue]


def test_ranking_is_independent_of_input_order_for_distinct_keys(equal_draw):
    high, medium, low = definition(1, 100), definition(2, 10), definition(3, 1)
    assert _weighted_sample_without_replacement([low, high, medium], 2) == [high, medium]
    assert _weighted_sample_without_replacement([medium, low, high], 2) == [high, medium]


def test_larger_uniform_draw_has_smaller_exponential_key(monkeypatch):
    draws = iter([0.1, 0.9])
    monkeypatch.setattr('app.services.events.selection.random.random', lambda: next(draws))
    first, second = definition(1, 100), definition(2, 100)
    assert _weighted_sample_without_replacement([first, second], 1) == [second]


@pytest.mark.parametrize('k', [0, -1])
def test_empty_request_never_draws(k, monkeypatch):
    def unexpected_draw():
        raise AssertionError('no random draw needed')
    monkeypatch.setattr('app.services.events.selection.random.random', unexpected_draw)
    assert _weighted_sample_without_replacement([definition(1, 1)], k) == []


def test_all_candidates_are_returned_without_duplicates(equal_draw):
    definitions = [definition(1, 100), definition(2, 10)]
    assert _weighted_sample_without_replacement(definitions, 5) == definitions
    assert _weighted_sample_without_replacement([], 2) == []
