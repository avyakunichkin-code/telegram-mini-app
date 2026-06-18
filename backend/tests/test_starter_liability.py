"""Стартовые долги из blueprint: annuity, secured link, credit card."""

from __future__ import annotations

from app.finance.liability_kinds import PAYMENT_MODE_ANNUITY, PAYMENT_MODE_INTEREST_ONLY
from app.finance.starter_liability import (
    build_starter_liability,
    resolve_starter_liability_spec,
)
from app.models import FinanceAsset, FinanceLiability


class TestResolveStarterLiabilitySpec:
    def test_mortgage_from_title(self):
        spec = resolve_starter_liability_spec({"title": "Ипотека"})
        assert spec.liability_kind == "mortgage"
        assert spec.payment_mode == PAYMENT_MODE_ANNUITY
        assert spec.term_periods == 240
        assert spec.secured_asset_kind == "home"

    def test_auto_loan_from_title(self):
        spec = resolve_starter_liability_spec({"title": "Автокредит"})
        assert spec.liability_kind == "auto_loan"
        assert spec.term_periods == 60
        assert spec.secured_asset_kind == "car"

    def test_credit_card_interest_only(self):
        spec = resolve_starter_liability_spec({"title": "Кредитная карта"})
        assert spec.payment_mode == PAYMENT_MODE_INTEREST_ONLY
        assert spec.term_periods is None
        assert spec.secured_asset_kind is None


class TestBuildStarterLiability:
    def test_links_mortgage_to_home_asset(self):
        asset = FinanceAsset(id=1, kind="home", title="Квартира", asset_value=10_000_000)
        liab = build_starter_liability(
            profile_id=7,
            blueprint_li={
                "title": "Ипотека",
                "total_debt": 2_700_000,
                "annual_rate_percent": 13.5,
            },
            assets=[asset],
            used_secured_asset_ids=set(),
        )
        assert liab.payment_mode == PAYMENT_MODE_ANNUITY
        assert liab.term_periods == 240
        assert liab.secured_asset_id == 1
        assert asset.acquisition_mode == "secured"
        assert liab.monthly_payment > 0


def test_starter_template_professional_has_annuity_auto_loan(client, auth_headers, db_session):
    start = client.post(
        "/api/game/start",
        headers=auth_headers,
        json={
            "profile_name": "Pro DL1",
            "save_kind": "game",
            "template_key": "mq_game_tight_budget_v1",
        },
    )
    assert start.status_code == 200, start.text

    liabs = (
        db_session.query(FinanceLiability)
        .filter(FinanceLiability.game_profile_id == start.json()["profile_id"])
        .all()
    )
    assert len(liabs) == 1
    auto = liabs[0]
    assert auto.payment_mode == PAYMENT_MODE_ANNUITY
    assert auto.liability_kind == "auto_loan"
    assert auto.secured_asset_id is not None


def test_starter_entrepreneur_credit_card_no_prepay(client, auth_headers, db_session):
    start = client.post(
        "/api/game/start",
        headers=auth_headers,
        json={
            "profile_name": "Ent DL1",
            "save_kind": "game",
            "template_key": "mq_game_debt_stack_v1",
        },
    )
    assert start.status_code == 200, start.text

    liabs = (
        db_session.query(FinanceLiability)
        .filter(FinanceLiability.game_profile_id == start.json()["profile_id"])
        .all()
    )
    by_title = {l.title: l for l in liabs}
    assert by_title["Ипотека"].payment_mode == PAYMENT_MODE_ANNUITY
    assert by_title["Кредитная карта"].payment_mode == PAYMENT_MODE_INTEREST_ONLY

    card_id = by_title["Кредитная карта"].id
    prepay = client.post(
        f"/api/finance/liabilities/{card_id}/prepay",
        json={"amount": 10_000},
        headers=auth_headers,
    )
    assert prepay.status_code == 400
    assert "Частичное" in prepay.json()["detail"]
