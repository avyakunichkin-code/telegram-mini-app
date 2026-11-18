"""Аналитика по снимкам периодов (без зависимости от роутеров). Формула — `fincore.metrics` (ADR-009, SPL-207)."""

from __future__ import annotations

from sqlalchemy.orm import Session

from fincore.metrics import average_liquid_delta

from ..models import PeriodEconomyClosing


def _liquid_snapshot_total(row: PeriodEconomyClosing) -> float:
    return float(row.cash_balance or 0) + float(row.safety_fund_balance or 0)


def avg_net_cashflow_last_closed_intervals(
    db: Session, game_profile_id: int, max_intervals: int = 6
) -> tuple[float, int]:
    """
    Среднее Δ(наличные + подушка) между соседними снимками закрытия периода.
    Берём до max_intervals последних интервалов (нужно ≥2 снимка в окне).
    """
    rows = (
        db.query(PeriodEconomyClosing)
        .filter(PeriodEconomyClosing.game_profile_id == game_profile_id)
        .order_by(PeriodEconomyClosing.period_index.desc())
        .limit(max_intervals + 1)
        .all()
    )
    return average_liquid_delta([_liquid_snapshot_total(r) for r in reversed(rows)], max_intervals)
