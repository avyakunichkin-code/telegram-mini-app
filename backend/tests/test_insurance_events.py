"""Страховые случаи из событий."""

import json

import pytest

from app.events.insurance_hooks import apply_insurance_claim_from_effects, find_policy_for_claim
from app.models import EventChoice, EventDefinition, EventInstance, GameProfile, InsurancePolicy


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
