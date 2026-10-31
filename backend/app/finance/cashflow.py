"""Месячный свободный поток профиля по метрикам fincore (ADR-009, SPL-207).

доход  = income_steady (зарплата + доход имущества) + invest_income_projection (вклады, купоны)
расход = structural_obligations (платежи по долгам + содержание имущества) + lifestyle_burn

Используется событиями (prerequisite `negative_monthly_flow`, подсказка о дыре в бюджете).
Это оценка «если забирать зарплату»: на закрытии периода зарплата учитывается, только если её
забрали. Страховые премии и погашение просрочки не входят — подсказка может не сработать при
очень маленькой дыре, но не сработает ложно из-за них.
"""

from __future__ import annotations

from dataclasses import dataclass

from fincore import metrics
from sqlalchemy.orm import Session

from ..game.adapters.fincore_snapshot import build_household_snapshot
from ..models import GameProfile


@dataclass(frozen=True)
class MonthlyFlow:
    income: float
    outflow: float

    @property
    def net(self) -> float:
        return round(self.income - self.outflow, 2)


def monthly_flow(db: Session, profile: GameProfile) -> MonthlyFlow:
    snap = build_household_snapshot(db, profile)
    income = metrics.income_steady(snap) + metrics.invest_income_projection(snap)
    outflow = metrics.structural_obligations(snap) + metrics.lifestyle_burn(snap)
    return MonthlyFlow(income=round(income, 2), outflow=round(outflow, 2))
