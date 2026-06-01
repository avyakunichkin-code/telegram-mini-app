"""DL1 integration: secured acquisition, consumer, sale, prepay, insurance."""

from __future__ import annotations

import pytest

from app.models import FinanceAsset, FinanceLiability, GameProfile, Transaction
from tests.fixtures.capital import capital_unlocked_profile  # noqa: F401
from tests.fixtures.dl1_catalog import seed_dl1_catalog
from tests.fixtures.dl1_golden_vectors import (
    V1_AFTER_P2_DEBT,
    V1_AFTER_PREPAY_DEBT,
    V1_ANNUAL_RATE,
    V1_MONTHLY_PAYMENT,
    V1_MONTHLY_PAYMENT_AFTER_PREPAY,
    V1_PREPAY_AMOUNT,
    V1_PRINCIPAL,
    V1_TERM,
    V2_ASSET_VALUE,
    V2_CASH_NET,
    V2_DEBT,
    V2_OVERDUE,
    V2_PAYOFF,
)
from tests.fixtures.game import create_finance_liability, create_game_profile


@pytest.fixture()
def dl1_client(client, db_session, capital_unlocked_profile):
    seed_dl1_catalog(db_session)
    return client, db_session, capital_unlocked_profile


@pytest.fixture()
def auth_client(dl1_client, auth_headers):
    client, db, profile = dl1_client
    return client, db, profile, auth_headers


def test_secured_acquisition_no_cash_disbursement(auth_client):
    client, db, profile, headers = auth_client
    cash_before = float(profile.cash_balance)
    resp = client.post(
        "/api/finance/acquisitions/secured",
        json={"liability_key": "mortgage", "asset_key": "apt_2br"},
        headers=headers,
    )
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["asset"]["acquisition_mode"] == "secured"
    assert body["liability"]["liability_kind"] == "mortgage"
    assert body["liability"]["secured_asset_id"] == body["asset"]["id"]
    assert body["liability"]["total_debt"] == 8_000_000.0

    db.refresh(profile)
    assert float(profile.cash_balance) == cash_before - 2_000_000.0
    disb = (
        db.query(Transaction)
        .filter(
            Transaction.game_profile_id == profile.id,
            Transaction.type == "liability_disbursement",
        )
        .all()
    )
    assert disb == []


def test_mortgage_from_template_rejected(auth_client):
    client, _db, _profile, headers = auth_client
    resp = client.post(
        "/api/finance/liabilities/from-template",
        json={"key": "mortgage"},
        headers=headers,
    )
    assert resp.status_code == 400
    assert "secured" in resp.json()["detail"].lower()


def test_consumer_loan_limit(auth_client):
    client, _db, profile, headers = auth_client
    for _ in range(2):
        r = client.post(
            "/api/finance/liabilities/from-template",
            json={"key": "consumer"},
            headers=headers,
        )
        assert r.status_code == 200
    r3 = client.post(
        "/api/finance/liabilities/from-template",
        json={"key": "consumer"},
        headers=headers,
    )
    assert r3.status_code == 400


def _apply_golden_v1_after_p2(db, asset_id: int, liability_id: int) -> None:
    """Привязать secured-сделку к состоянию V1 после 2 полных платежей (SPEC §4.4)."""
    asset = db.query(FinanceAsset).filter(FinanceAsset.id == asset_id).first()
    liab = db.query(FinanceLiability).filter(FinanceLiability.id == liability_id).first()
    asset.asset_value = V2_ASSET_VALUE
    liab.total_debt = V1_AFTER_P2_DEBT
    liab.original_principal = V1_PRINCIPAL
    liab.annual_rate_percent = V1_ANNUAL_RATE
    liab.monthly_payment = V1_MONTHLY_PAYMENT
    liab.term_periods = V1_TERM
    liab.periods_paid = 2
    liab.payment_mode = "annuity"
    liab.overdue_amount = 0
    db.commit()


def test_asset_sale_with_mortgage_payoff(auth_client):
    client, db, profile, headers = auth_client
    created = client.post(
        "/api/finance/acquisitions/secured",
        json={"liability_key": "mortgage", "asset_key": "apt_2br"},
        headers=headers,
    ).json()
    asset_id = created["asset"]["id"]
    liability_id = created["liability"]["id"]
    _apply_golden_v1_after_p2(db, asset_id, liability_id)

    liab = db.query(FinanceLiability).filter(FinanceLiability.id == liability_id).first()
    liab.total_debt = V2_DEBT
    liab.overdue_amount = V2_OVERDUE
    db.commit()
    cash_before = float(profile.cash_balance)
    db.refresh(profile)

    resp = client.delete(f"/api/finance/assets/{asset_id}", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["payoff"] == pytest.approx(V2_PAYOFF, abs=0.01)
    assert data["cash_net"] == pytest.approx(V2_CASH_NET, abs=0.01)

    db.refresh(profile)
    assert float(profile.cash_balance) == pytest.approx(cash_before + V2_CASH_NET, abs=0.01)
    assert db.query(FinanceAsset).filter(FinanceAsset.id == asset_id, FinanceAsset.is_active == 1).first() is None


def test_prepay_reduces_debt(auth_client):
    client, db, _profile, headers = auth_client
    created = client.post(
        "/api/finance/acquisitions/secured",
        json={"liability_key": "mortgage", "asset_key": "apt_2br"},
        headers=headers,
    ).json()
    _apply_golden_v1_after_p2(db, created["asset"]["id"], created["liability"]["id"])
    lid = created["liability"]["id"]
    resp = client.post(
        f"/api/finance/liabilities/{lid}/prepay",
        json={"amount": V1_PREPAY_AMOUNT},
        headers=headers,
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["total_debt"] == pytest.approx(V1_AFTER_PREPAY_DEBT, abs=0.01)
    assert body["monthly_payment"] == pytest.approx(V1_MONTHLY_PAYMENT_AFTER_PREPAY, abs=0.01)


def test_insurance_requires_asset(auth_client):
    client, _db, _profile, headers = auth_client
    resp = client.post(
        "/api/insurance/buy",
        json={"plan_key": "auto_liability_basic"},
        headers=headers,
    )
    assert resp.status_code == 400


def test_insurance_with_car_asset(auth_client):
    client, db, profile, headers = auth_client
    asset = FinanceAsset(
        game_profile_id=profile.id,
        title="Test car",
        kind="car_personal",
        asset_value=1_000_000,
        monthly_maintenance_cost=0,
        acquisition_mode="cash",
        is_active=1,
    )
    db.add(asset)
    db.commit()
    db.refresh(asset)

    resp = client.post(
        "/api/insurance/buy",
        json={"plan_key": "auto_liability_basic", "insured_asset_id": asset.id},
        headers=headers,
    )
    assert resp.status_code == 200
    assert resp.json()["policy"]["insured_asset_id"] == asset.id


def test_annuity_period_close_reduces_debt(db_session, test_user):
    from app.game.period import process_period_end
    from tests.fixtures.dl1_golden_vectors import V1_AFTER_P1_DEBT, V1_ANNUAL_RATE, V1_MONTHLY_PAYMENT, V1_PRINCIPAL, V1_TERM
    from tests.fixtures.game import create_profile_ready_for_period_close

    profile = create_profile_ready_for_period_close(
        db_session,
        user_id=test_user.id,
        cash_balance=200_000.0,
        period_index=1,
    )
    from app.finance.annuity import monthly_payment

    pay = monthly_payment(V1_PRINCIPAL, V1_ANNUAL_RATE, V1_TERM)
    assert pay == V1_MONTHLY_PAYMENT
    create_finance_liability(
        db_session,
        profile.id,
        total_debt=V1_PRINCIPAL,
        monthly_payment=pay,
        liability_kind="consumer",
        payment_mode="annuity",
        term_periods=V1_TERM,
        periods_paid=0,
    )
    process_period_end(db_session, profile)
    row = (
        db_session.query(FinanceLiability)
        .filter(FinanceLiability.game_profile_id == profile.id)
        .first()
    )
    assert float(row.total_debt) == pytest.approx(V1_AFTER_P1_DEBT, abs=0.01)
    assert int(row.periods_paid) == 1


def test_legacy_interest_only_unchanged(db_session, test_user):
    from app.finance.liability_kinds import effective_payment_mode, PAYMENT_MODE_INTEREST_ONLY

    profile = create_game_profile(db_session, user_id=test_user.id, cash_balance=50_000.0)
    liab = create_finance_liability(
        db_session,
        profile.id,
        total_debt=100_000.0,
        monthly_payment=1_000.0,
        liability_kind="unsecured",
        payment_mode="interest_only",
    )
    assert effective_payment_mode(liab) == PAYMENT_MODE_INTEREST_ONLY
