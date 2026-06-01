"""Сид каталога DL1: car_loan + mortgage metadata."""

from app.models import LiabilityTemplate
from app.seeds.capital_catalog import upsert_capital_liability_catalog


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
