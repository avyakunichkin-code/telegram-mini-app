"""Утилиты для property-lite тестов денежных инвариантов."""

from __future__ import annotations

import math


def assert_finite_money(value: float, *, label: str = "balance") -> float:
    v = float(value)
    assert math.isfinite(v), f"{label} must be finite, got {value!r}"
    return v
