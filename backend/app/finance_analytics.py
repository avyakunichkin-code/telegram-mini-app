"""Аналитика по снимкам периодов (без зависимости от роутеров)."""

from __future__ import annotations

from sqlalchemy.orm import Session

from .models import PeriodEconomyClosing


def _liquid_snapshot_total(row: PeriodEconomyClosing) -> float:
    return float(row.cash_balance or 0) + float(row.safety_fund_balance or 0)


def avg_net_cashflow_last_closed_intervals(
    db: Session, game_profile_id: int, max_intervals: int = 6
) -> tuple[float, int]:
    """
    Среднее Δ(наличные + подушка) между соседними снимками закрытия периода.
    Берём до max_intervals последних интервалов (нужно ≥2 снимка в окне).
    """
    limit = max_intervals + 1
    rows = (
        db.query(PeriodEconomyClosing)
        .filter(PeriodEconomyClosing.game_profile_id == game_profile_id)
        .order_by(PeriodEconomyClosing.period_index.desc())
        .limit(limit)
        .all()
    )
    if len(rows) < 2:
        return 0.0, 0
    ascending = list(reversed(rows))
    deltas: list[float] = []
    for i in range(1, len(ascending)):
        deltas.append(_liquid_snapshot_total(ascending[i]) - _liquid_snapshot_total(ascending[i - 1]))
    tail = deltas[-max_intervals:]
    if not tail:
        return 0.0, 0
    return round(sum(tail) / len(tail), 2), len(tail)
