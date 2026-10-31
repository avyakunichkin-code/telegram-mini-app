"""
Стратегия погашения долгов: «как сейчас», «лавина», «снежный ком» (SPEC_plan-v1 п. 4).

Проценты месяца округляются `fincore.money.quantize_money`, как в ядре. Сверх платежа Plan
гасит тело досрочно и перекидывает платежи закрытых долгов на следующий («каскад»).
"""

from __future__ import annotations

from dataclasses import dataclass

from fincore.household import Liability
from fincore.money import EPSILON, quantize_money

from . import config


@dataclass(frozen=True)
class Payoff:
    months: int | None  # None — не гасится за MAX_PAYOFF_MONTHS
    total_interest: float
    order: tuple[str, ...]


def simulate(liabilities: tuple[Liability, ...], *, extra: float = 0.0, strategy: str = "current") -> Payoff:
    debts = {li.id: [li, li.total_debt + li.overdue_amount] for li in liabilities if li.total_debt > EPSILON}
    if not debts:
        return Payoff(months=0, total_interest=0.0, order=())
    cascade = strategy in ("avalanche", "snowball")
    released = 0.0  # платежи закрытых долгов
    total_interest, closed = 0.0, []

    def close(key) -> None:
        nonlocal released
        li = debts.pop(key)[0]
        closed.append(li.title)
        released += li.monthly_payment

    for month in range(1, config.MAX_PAYOFF_MONTHS + 1):
        released_before = released  # закрытые в этом месяце отдают только неизрасходованный остаток
        leftover = 0.0
        for key in list(debts):
            li, bal = debts[key]
            interest = quantize_money(bal * li.annual_rate_percent / 100 / 12)
            pay = min(li.monthly_payment, bal + interest)
            total_interest += interest
            debts[key][1] = quantize_money(bal + interest - pay)
            if debts[key][1] <= EPSILON:
                leftover += li.monthly_payment - pay
                close(key)
        pool = (extra + released_before + leftover) if cascade else 0.0
        while pool > EPSILON and debts:
            if strategy == "avalanche":
                key = max(debts, key=lambda k: debts[k][0].annual_rate_percent)
            else:
                key = min(debts, key=lambda k: debts[k][1])
            applied = min(pool, debts[key][1])
            debts[key][1] = quantize_money(debts[key][1] - applied)
            pool -= applied
            if debts[key][1] <= EPSILON:
                close(key)
        if not debts:
            return Payoff(months=month, total_interest=round(total_interest, 2), order=tuple(closed))
    return Payoff(months=None, total_interest=round(total_interest, 2), order=tuple(closed))
