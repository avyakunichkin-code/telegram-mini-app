"""Сид каталога DL1: asset + liability metadata."""

from app.models import AssetTemplate, LiabilityTemplate
from app.seeds.capital_catalog import upsert_capital_asset_catalog, upsert_capital_liability_catalog


def test_upsert_asset_catalog_real_estate_and_cars(db_session):
    upsert_capital_asset_catalog(db_session)
    active = (
        db_session.query(AssetTemplate)
        .filter(AssetTemplate.is_active == 1)
        .order_by(AssetTemplate.sort_order.asc())
        .all()
    )
    keys = {row.template_key for row in active}
    assert "apt_1br" in keys
    assert "car_personal" in keys
    assert "car_taxi" in keys
    assert "home" not in keys
    assert "rental_home" not in keys

    apt = (
        db_session.query(AssetTemplate)
        .filter(AssetTemplate.template_key == "apt_1br")
        .first()
    )
    assert apt is not None
    assert apt.kind == "home"
    assert float(apt.asset_value) == 5_000_000.0


def test_upsert_car_loan_secured_metadata(db_session):
    upsert_capital_liability_catalog(db_session)
    row = (
        db_session.query(LiabilityTemplate)
        .filter(LiabilityTemplate.template_key == "car_loan")
        .first()
    )
    assert row is not None
    assert row.liability_kind == "auto_loan"
    assert row.disbursement_mode == "to_asset_purchase"
    assert row.requires_asset_kind == "car"
    assert row.linked_asset_template_key == "car_personal"
    assert int(row.term_periods) == 60
    assert float(row.down_payment_amount) == 300_000.0


def test_upsert_mortgage_apt_1br(db_session):
    upsert_capital_liability_catalog(db_session)
    row = (
        db_session.query(LiabilityTemplate)
        .filter(LiabilityTemplate.template_key == "mortgage")
        .first()
    )
    assert row is not None
    assert row.linked_asset_template_key == "apt_1br"
    assert float(row.down_payment_amount) == 1_000_000.0
    assert float(row.total_debt) == 4_000_000.0
