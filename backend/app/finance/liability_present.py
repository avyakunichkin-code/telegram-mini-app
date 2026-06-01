"""Serialize FinanceLiability for API responses."""

from __future__ import annotations

from ..models import FinanceLiability
from ..schemas import LiabilityResponse
from .liability_kinds import effective_liability_kind, effective_payment_mode, remaining_periods


def liability_to_response(liability: FinanceLiability) -> LiabilityResponse:
    term = getattr(liability, "term_periods", None)
    return LiabilityResponse(
        id=liability.id,
        title=liability.title,
        total_debt=float(liability.total_debt),
        annual_rate_percent=float(liability.annual_rate_percent),
        monthly_payment=float(liability.monthly_payment),
        overdue_amount=float(getattr(liability, "overdue_amount", 0) or 0),
        overdue_periods=int(getattr(liability, "overdue_periods", 0) or 0),
        created_at=liability.created_at,
        liability_kind=effective_liability_kind(liability),
        secured_asset_id=getattr(liability, "secured_asset_id", None),
        term_periods=int(term) if term is not None else None,
        periods_paid=int(getattr(liability, "periods_paid", 0) or 0),
        original_principal=float(getattr(liability, "original_principal", 0) or 0) or None,
        payment_mode=effective_payment_mode(liability),
        remaining_periods=remaining_periods(liability) or None,
    )
