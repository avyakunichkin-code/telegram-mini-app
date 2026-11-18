"""Read-only previews. Transfers change cash/reserve, never household wealth."""
from dataclasses import replace
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field
from fincore.metrics import compute_metrics
from fincore.month import month_step
from fincore.forecast import next_snapshot

from ..schemas import Checkup, Money, Range
from .adapter import build_snapshot, month_label
from . import config


class SensitivityIn(BaseModel):
    model_config = ConfigDict(extra='forbid')
    mode: Literal['sensitivity']
    section: Literal['incomes', 'expenses']
    row_index: Annotated[int, Field(ge=0, le=49, strict=True)]


class ContributionIn(BaseModel):
    model_config = ConfigDict(extra='forbid')
    mode: Literal['cushion_contribution']
    monthly_amount: Money
    horizon_months: Annotated[int, Field(ge=1, le=12, strict=True)] = 12


PreviewIn = Annotated[SensitivityIn | ContributionIn, Field(discriminator='mode')]


def free_cashflow(ck: Checkup) -> float:
    snap = build_snapshot(ck.data, ck.as_of)
    metrics = compute_metrics(snap)
    return round(metrics.income_steady - metrics.total_monthly_outflow - sum(p.monthly_premium for p in snap.policies), 2)


def preview(ck: Checkup, body: SensitivityIn | ContributionIn) -> dict:
    common = {'mode': body.mode, 'rules_version': config.RULES_VERSION, 'as_of': ck.as_of}
    if isinstance(body, SensitivityIn):
        rows = getattr(ck.data, body.section)
        if body.row_index >= len(rows):
            raise ValueError('Строка не найдена. Обновите данные чекапа.')
        amount = rows[body.row_index].amount
        results = []
        for value in [amount.min, amount.max]:
            alternative = ck.model_copy(deep=True)
            getattr(alternative.data, body.section)[body.row_index].amount = Range.exact(value)
            results.append({'input': float(value), 'free_cashflow': free_cashflow(alternative)})
        return {**common, 'baseline': {'free_cashflow': free_cashflow(ck)}, 'endpoints': results,
                'assumptions': 'Меняется только выбранная сумма. Остальные диапазоны — по середине. Это месячный поток, не вероятность и не прогноз ликвидности.'}

    start = build_snapshot(ck.data, ck.as_of, merge_cushion=False)
    amount = float(body.monthly_amount)

    def trajectory(contribution: float) -> tuple[list[dict], int | None]:
        current, points, first = start, [], None
        for i in range(body.horizon_months):
            result = month_step(current, credit_income=True)
            overdue = sum(o.overdue_amount for o in result.liabilities)
            available = round(result.cash_end - overdue, 2)
            possible = available >= contribution and available >= 0
            if not possible and first is None:
                first = i + 1
            transferred = contribution if possible else 0
            updated = next_snapshot(current, result)
            current = replace(updated, cash=round(updated.cash - transferred, 2), safety_fund=round(updated.safety_fund + transferred, 2))
            points.append({'month': month_label(start.month_index + i), 'cash': round(current.cash, 2),
                           'available_after_contribution': round(available - transferred, 2),
                           'cushion': round(current.safety_fund, 2), 'transferred': transferred})
        return points, first

    baseline, _ = trajectory(0)
    alternative, shortfall = trajectory(amount)
    return {**common, 'baseline': baseline, 'alternative': alternative,
            'available_after_contribution': alternative[0]['available_after_contribution'],
            'cushion_delta': round(alternative[-1]['cushion'] - baseline[-1]['cushion'], 2),
            'first_shortfall_month': shortfall,
            'assumptions': 'Середины диапазонов. Перевод после обязательных списаний, только при достаточном остатке; при нехватке пропускается. Резерв не расходуется автоматически и не приносит процентов. Это перевод своих денег, не рост капитала.'}
