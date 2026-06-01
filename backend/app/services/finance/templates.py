from sqlalchemy.orm import Session

from ...finance.annuity import monthly_payment as annuity_monthly_payment
from ...finance.helpers import monthly_interest_payment
from ...models import AssetTemplate, LiabilityTemplate


def list_asset_templates(db: Session) -> list[dict]:
    rows = (
        db.query(AssetTemplate)
        .filter(AssetTemplate.is_active == 1)
        .order_by(AssetTemplate.sort_order.asc(), AssetTemplate.id.asc())
        .all()
    )
    return [
        {
            "key": t.template_key,
            "title": t.title,
            "kind": t.kind,
            "asset_value": float(t.asset_value),
            "monthly_maintenance_cost": float(t.monthly_maintenance_cost),
            "monthly_income": float(t.monthly_income or 0),
        }
        for t in rows
    ]


def list_liability_templates(db: Session) -> list[dict]:
    rows = (
        db.query(LiabilityTemplate)
        .filter(LiabilityTemplate.is_active == 1)
        .order_by(LiabilityTemplate.sort_order.asc(), LiabilityTemplate.id.asc())
        .all()
    )
    out = []
    for t in rows:
        td = float(t.total_debt)
        ar = float(t.annual_rate_percent)
        term = int(getattr(t, "term_periods", 0) or 0)
        if term > 0:
            mp = annuity_monthly_payment(td, ar, term)
        else:
            mp = monthly_interest_payment(td, ar)
        out.append(
            {
                "key": t.template_key,
                "title": t.title,
                "total_debt": td,
                "annual_rate_percent": ar,
                "monthly_payment": mp,
                "liability_kind": getattr(t, "liability_kind", None),
                "disbursement_mode": getattr(t, "disbursement_mode", None),
                "term_periods": term if term > 0 else None,
                "down_payment_amount": float(getattr(t, "down_payment_amount", 0) or 0),
                "requires_asset_kind": getattr(t, "requires_asset_kind", None),
                "linked_asset_template_key": getattr(t, "linked_asset_template_key", None),
            }
        )
    return out

