"""Catalog rows for DL1 integration tests."""

from __future__ import annotations

from app.models import AssetTemplate, LiabilityTemplate


def seed_dl1_catalog(db) -> None:
    """Idempotent seed for in-memory SQLite tests."""
    pairs = [
        LiabilityTemplate(
            template_key="mortgage",
            title="Ипотека",
            total_debt=4_000_000,
            annual_rate_percent=12.0,
            liability_kind="mortgage",
            term_periods=240,
            disbursement_mode="to_asset_purchase",
            down_payment_amount=1_000_000,
            requires_asset_kind="home",
            linked_asset_template_key="apt_1br",
            is_active=1,
            sort_order=10,
        ),
        LiabilityTemplate(
            template_key="car_loan",
            title="Автокредит",
            total_debt=900_000,
            annual_rate_percent=14.0,
            liability_kind="auto_loan",
            term_periods=60,
            disbursement_mode="to_asset_purchase",
            down_payment_amount=300_000,
            requires_asset_kind="car",
            linked_asset_template_key="car_personal",
            is_active=1,
            sort_order=20,
        ),
        LiabilityTemplate(
            template_key="consumer",
            title="Потребительский",
            total_debt=400_000,
            annual_rate_percent=18.0,
            liability_kind="consumer",
            term_periods=36,
            disbursement_mode="to_cash",
            is_active=1,
            sort_order=30,
        ),
        AssetTemplate(
            template_key="apt_1br",
            title="1-комнатная",
            kind="home",
            asset_value=5_000_000,
            monthly_maintenance_cost=18_000,
            monthly_income=0,
            is_active=1,
            sort_order=11,
        ),
        AssetTemplate(
            template_key="car_personal",
            title="Авто",
            kind="car_personal",
            asset_value=1_200_000,
            monthly_maintenance_cost=12_000,
            monthly_income=0,
            is_active=1,
            sort_order=30,
        ),
    ]
    for row in pairs:
        existing = None
        if isinstance(row, LiabilityTemplate):
            existing = (
                db.query(LiabilityTemplate)
                .filter(LiabilityTemplate.template_key == row.template_key)
                .first()
            )
        else:
            existing = (
                db.query(AssetTemplate)
                .filter(AssetTemplate.template_key == row.template_key)
                .first()
            )
        if not existing:
            db.add(row)
    db.commit()
