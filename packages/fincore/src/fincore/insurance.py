"""Страховые премии за месяц (SPL-205). Деактивацию истёкших полисов делает приложение."""

from __future__ import annotations

from .household import InsurancePolicy


def premium_due(policy: InsurancePolicy, month_index: int) -> float:
    """
    Премия к списанию в конце месяца `month_index`.

    0 — если по полису уже была выплата, срок истёк (`month_index >= expires`) или это месяц
    оформления: первая премия списывается при покупке, а не в конце месяца.
    """
    if policy.claimed_month_index is not None:
        return 0.0
    if policy.expires_month_index is not None and month_index >= int(policy.expires_month_index):
        return 0.0
    if int(policy.started_month_index or 0) == month_index:
        return 0.0
    return float(policy.monthly_premium or 0)
