"""Деньги: округление до копеек. Единое правило для всех расчётов ядра."""

from __future__ import annotations

from decimal import Decimal, ROUND_HALF_UP

CENT = Decimal("0.01")


def quantize_money(value: Decimal | float | int) -> float:
    """Округлить сумму до копеек (ROUND_HALF_UP) и вернуть float — формат хранения в приложениях."""
    return float(Decimal(str(value)).quantize(CENT, rounding=ROUND_HALF_UP))


# Порог «ноль» для денежных сравнений (как `app.constants.EPSILON` игры).
EPSILON = 1e-6
