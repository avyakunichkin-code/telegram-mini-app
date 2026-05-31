"""Страховые случаи из событий."""

import json

import pytest

from app.events.insurance_hooks import apply_insurance_claim_from_effects, find_policy_for_claim
from app.models import EventChoice, EventDefinition, EventInstance, GameProfile, GameStarterTemplate, InsurancePolicy
from app.victory.seeds import victory_config_json_for_template

INSURANCE_TEST_TEMPLATE_KEY = "mq_game_insurance_pytest_v1"


def _ensure_insurance_test_template(db_session) -> None:
    existing = (
        db_session.query(GameStarterTemplate)
        .filter(GameStarterTemplate.template_key == INSURANCE_TEST_TEMPLATE_KEY)
        .first()
    )
    if existing:
        return
    db_session.add(
        GameStarterTemplate(
            template_key=INSURANCE_TEST_TEMPLATE_KEY,
            title="Pytest insurance",
            difficulty_rank=1,
            base_monthly_lifestyle_expense=30000.0,
            blueprint_json=json.dumps(
                {
                    "period_duration_seconds": 300,
                    "cash_balance": 50000,
                    "monthly_salary": 100000,
                    "assets": [],
                    "liabilities": [],
                    "mechanics": {
                        "capital_invest": True,
                        "capital_insurance": True,
                        "capital_property": False,
                        "capital_liabilities": False,
                    },
                    "mechanics_unlock": [
                        {
                            "after_goal": None,
                            "grant": ["capital_flows", "capital_invest", "capital_insurance"],
                        },
                    ],
                },
                ensure_ascii=False,
            ),
            victory_config_json=victory_config_json_for_template("mq_game_basic_v1"),
            is_active=1,
            sort_order=99,
        )
    )
    db_session.commit()


def _profile(db, **kwargs):
    p = GameProfile(
        user_id=1,
        name="insurance_evt",
        save_kind="game",
        is_active=1,
        cash_balance=10000.0,
        period_index=3,
        **kwargs,
    )
    db.add(p)
    db.commit()
    db.refresh(p)
    return p


def _policy(db, profile_id, *, kind="auto_liability", payout=400000.0):
    pol = InsurancePolicy(
        game_profile_id=profile_id,
        product="auto",
        insured_object="liability",
        kind=kind,
        title="ОСАГО тест",
        monthly_premium=2400.0,
        payout_amount=payout,
        coverage_limit=payout,
        term_periods=12,
        started_period_index=1,
        is_active=1,
    )
    db.add(pol)
    db.commit()
    db.refresh(pol)
    return pol


class TestInsuranceEvents:
    def test_find_policy_by_kind(self, db_session):
        profile = _profile(db_session)
        pol = _policy(db_session, profile.id)
        found = find_policy_for_claim(db_session, profile.id, kind="auto_liability")
        assert found is not None
        assert found.id == pol.id

    def test_apply_claim_pays_and_closes_policy(self, db_session):
        profile = _profile(db_session)
        _policy(db_session, profile.id)
        result = apply_insurance_claim_from_effects(
            db_session,
            profile,
            {"product": "auto", "insured_object": "liability"},
            3,
        )
        assert result["applied"] is True
        assert result["payout_amount"] == 400000.0
        db_session.refresh(profile)
        assert profile.cash_balance == 410000.0
        pol = db_session.query(InsurancePolicy).filter(InsurancePolicy.game_profile_id == profile.id).first()
        assert pol.is_active == 0
        assert pol.claimed_period_index == 3

    def test_apply_claim_without_policy_raises(self, db_session):
        profile = _profile(db_session)
        with pytest.raises(ValueError, match="полиса"):
            apply_insurance_claim_from_effects(
                db_session,
                profile,
                {"kind": "auto_liability"},
                3,
            )


class TestChooseEventInsuranceClaim:
    def test_choose_event_returns_insurance_claim(self, client, db_session, test_user):
        profile = GameProfile(
            user_id=test_user.id,
            name="evt_api",
            save_kind="game",
            is_active=1,
            cash_balance=5000.0,
            period_index=2,
        )
        db_session.add(profile)
        db_session.commit()
        db_session.refresh(profile)

        _policy(db_session, profile.id)

        ed = EventDefinition(key="test_dtp", mode="any", title="ДТП", is_active=1, weight=100)
        db_session.add(ed)
        db_session.flush()
        choice = EventChoice(
            definition_id=ed.id,
            title="По полису",
            effects_json=json.dumps(
                {"insurance_claim": {"kind": "auto_liability"}, "xp_delta": 1},
                ensure_ascii=False,
            ),
        )
        db_session.add(choice)
        db_session.flush()
        inst = EventInstance(
            game_profile_id=profile.id,
            definition_id=ed.id,
            period_index=2,
            status="pending",
        )
        db_session.add(inst)
        db_session.commit()
        db_session.refresh(inst)
        db_session.refresh(choice)

        res = client.post(
            f"/api/game/events/{inst.id}/choose",
            json={"choice_id": choice.id},
        )
        assert res.status_code == 200
        body = res.json()
        assert body["insurance_claim"]["applied"] is True
        assert body["insurance_claim"]["payout_amount"] == 400000.0

    def test_choose_event_insurance_claim_without_policy_400(self, client, db_session, test_user):
        profile = GameProfile(
            user_id=test_user.id,
            name="evt_no_pol",
            save_kind="game",
            is_active=1,
            cash_balance=5000.0,
            period_index=2,
        )
        db_session.add(profile)
        db_session.commit()
        db_session.refresh(profile)

        ed = EventDefinition(key="test_dtp_no_pol", mode="any", title="ДТП", is_active=1, weight=100)
        db_session.add(ed)
        db_session.flush()
        choice = EventChoice(
            definition_id=ed.id,
            title="По полису",
            effects_json=json.dumps(
                {"insurance_claim": {"kind": "auto_liability"}},
                ensure_ascii=False,
            ),
        )
        db_session.add(choice)
        db_session.flush()
        inst = EventInstance(
            game_profile_id=profile.id,
            definition_id=ed.id,
            period_index=2,
            status="pending",
        )
        db_session.add(inst)
        db_session.commit()
        db_session.refresh(inst)
        db_session.refresh(choice)

        res = client.post(
            f"/api/game/events/{inst.id}/choose",
            json={"choice_id": choice.id},
        )
        assert res.status_code == 400
        assert "полис" in res.json()["detail"].lower()


class TestInsuranceBuyFlow:
    def test_buy_and_list_on_stress_template(self, client, auth_headers, db_session):
        _ensure_insurance_test_template(db_session)
        start = client.post(
            "/api/game/start",
            headers=auth_headers,
            json={
                "profile_name": "InsBuy",
                "save_kind": "game",
                "template_key": INSURANCE_TEST_TEMPLATE_KEY,
            },
        )
        assert start.status_code == 200

        buy = client.post(
            "/api/insurance/buy",
            headers=auth_headers,
            json={"plan_key": "auto_liability_standard"},
        )
        assert buy.status_code == 200
        body = buy.json()
        assert body["status"] == "success"
        assert body["policy"]["payout_amount"] == 400000.0
        assert body["policy"]["monthly_premium"] == 2400.0

        listed = client.get("/api/insurance/policies", headers=auth_headers)
        assert listed.status_code == 200
        policies = listed.json()
        assert len(policies) == 1
        assert policies[0]["kind"] == "auto_liability"
        assert policies[0]["is_active"] is True

    def test_cancel_policy(self, client, auth_headers, db_session):
        _ensure_insurance_test_template(db_session)
        client.post(
            "/api/game/start",
            headers=auth_headers,
            json={
                "profile_name": "InsCancel",
                "save_kind": "game",
                "template_key": INSURANCE_TEST_TEMPLATE_KEY,
            },
        )
        buy = client.post(
            "/api/insurance/buy",
            headers=auth_headers,
            json={"plan_key": "health_life_basic"},
        )
        assert buy.status_code == 200
        policy_id = buy.json()["policy_id"]

        cancel = client.post(f"/api/insurance/{policy_id}/cancel", headers=auth_headers)
        assert cancel.status_code == 200

        listed = client.get("/api/insurance/policies", headers=auth_headers)
        assert listed.json() == []
