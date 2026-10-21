"""
Нелинейная цена балла потребностей — SPEC_needs-set-point §1.

needs_points(C, S) = K · (C / S)^α: чем дороже покупка, тем больше баллов,
но каждый следующий балл дороже. Деление на зарплату S делает кривую
одинаковой для всех персон (CRRA: решения не зависят от масштаба).
"""

from __future__ import annotations

import math

CURVE_ALPHA = 0.30
IMPULSE_SCALE = 40.0  # калибровка NV-406 (2026-10-21): 2 события за период, потолок оси 15


def needs_points(
    cost: float,
    salary: float,
    *,
    k: float = IMPULSE_SCALE,
    alpha: float = CURVE_ALPHA,
) -> float:
    """Сколько баллов потребностей «положено» разовой трате cost при зарплате salary."""
    c = float(cost or 0)
    s = float(salary or 0)
    if c <= 0 or s <= 0 or not math.isfinite(c) or not math.isfinite(s):
        return 0.0
    return float(k) * (c / s) ** float(alpha)


def cost_for_points(
    points: float,
    salary: float,
    *,
    k: float = IMPULSE_SCALE,
    alpha: float = CURVE_ALPHA,
) -> float:
    """Обратная функция для авторинга: цена в ₽, за которую положено points баллов."""
    p = float(points or 0)
    s = float(salary or 0)
    if p <= 0 or s <= 0 or k <= 0:
        return 0.0
    return s * (p / float(k)) ** (1.0 / float(alpha))
