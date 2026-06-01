"""Каталог капитала (DL1): ипотека, автокредит, потребительский — идемпотентный upsert при старте API."""

from __future__ import annotations

from sqlalchemy.orm import Session

from ..models import LiabilityTemplate

# total_debt в шаблоне — ориентир для UI; secured bundle считает тело из asset − down_payment.
CAPITAL_LIABILITY_SEEDS: list[dict] = [
    {
        "template_key": "mortgage",
        "title": "Ипотека",
        "total_debt": 8_000_000.0,
        "annual_rate_percent": 12.0,
        "liability_kind": "mortgage",
        "term_periods": 240,
        "disbursement_mode": "to_asset_purchase",
        "down_payment_amount": 2_000_000.0,
        "requires_asset_kind": "home",
        "linked_asset_template_key": "apt_2br",
        "is_active": 1,
        "sort_order": 10,
    },
    {
        "template_key": "car_loan",
        "title": "Автокредит",
        "total_debt": 900_000.0,
        "annual_rate_percent": 14.0,
        "liability_kind": "auto_loan",
        "term_periods": 60,
        "disbursement_mode": "to_asset_purchase",
        "down_payment_amount": 300_000.0,
        "requires_asset_kind": "car",
        "linked_asset_template_key": "car_personal",
        "is_active": 1,
        "sort_order": 20,
    },
    {
        "template_key": "consumer",
        "title": "Потребительский кредит",
        "total_debt": 400_000.0,
        "annual_rate_percent": 18.0,
        "liability_kind": "consumer",
        "term_periods": 36,
        "disbursement_mode": "to_cash",
        "down_payment_amount": 0.0,
        "requires_asset_kind": None,
        "linked_asset_template_key": None,
        "is_active": 1,
        "sort_order": 30,
    },
    {
        "template_key": "credit_card",
        "title": "Кредитная карта",
        "total_debt": 150_000.0,
        "annual_rate_percent": 22.0,
        "liability_kind": "consumer",
        "term_periods": None,
        "disbursement_mode": "to_cash",
        "down_payment_amount": 0.0,
        "requires_asset_kind": None,
        "linked_asset_template_key": None,
        "is_active": 1,
        "sort_order": 40,
    },
]


def upsert_capital_liability_catalog(db: Session) -> None:
    """Синхронизировать liability_templates с DL1-метаданными (prod + dev)."""
    for seed in CAPITAL_LIABILITY_SEEDS:
        key = seed["template_key"]
        row = (
            db.query(LiabilityTemplate)
            .filter(LiabilityTemplate.template_key == key)
            .first()
        )
        if row is None:
            db.add(LiabilityTemplate(**seed))
            continue
        for field, value in seed.items():
            setattr(row, field, value)
    db.commit()
