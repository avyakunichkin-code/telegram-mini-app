"""Сквозные сценарии студента: диплом, мечта, карточка открытия (SPEC_student-progression)."""
import pytest
from fastapi import HTTPException

from app.events.chains import ensure_scheduled_chain_events, get_active_chain, schedule_event_chain
from app.events.mvp11_seeds import ensure_mvp11_event_catalog
from app.models import EventChoice, EventDefinition, EventInstance, FinanceSalary, GameProfile
from app.routers.events import ensure_period_events
from app.services.events import selection
from app.services.events.choose import choose_event


@pytest.fixture()
def student(db_session):
    ensure_mvp11_event_catalog(db_session)
    profile = GameProfile(
        user_id=1,
        name="student-chains",
        save_kind="game",
        starter_template_key="mq_game_basic_v1",
        is_active=1,
        period_index=1,
        cash_balance=200_000,
    )
    db_session.add(profile)
    db_session.commit()
    db_session.add(FinanceSalary(game_profile_id=profile.id, monthly_amount=62_500, monthly_receipts_count=1))
    db_session.commit()
    return profile


def _surface(db, profile, chain_key, followup, **context):
    schedule_event_chain(
        db, profile, chain_key=chain_key, followup_definition_key=followup, after_periods=1, context=context
    )
    db.commit()
    profile.period_index = 2
    db.commit()
    ensure_scheduled_chain_events(db, profile.id, 2)
    db.commit()
    defn = db.query(EventDefinition).filter(EventDefinition.key == followup).one()
    inst = (
        db.query(EventInstance)
        .filter(EventInstance.game_profile_id == profile.id, EventInstance.definition_id == defn.id)
        .one()
    )
    return defn, inst


def _choice(db, defn, title_part):
    rows = db.query(EventChoice).filter(EventChoice.definition_id == defn.id).all()
    return next(c for c in rows if title_part in c.title)


def _salary(db, profile):
    return db.query(FinanceSalary).filter(FinanceSalary.game_profile_id == profile.id).one().monthly_amount


def test_startup_outcome_raises_salary_and_ends_chain(db_session, student):
    defn, inst = _surface(db_session, student, "student_diploma", "mq11_student_diploma_startup", branch="startup")
    choose_event(db_session, student, inst.id, _choice(db_session, defn, "Остаться").id)
    assert _salary(db_session, student) == 107_500
    assert get_active_chain(db_session, student.id, "student_diploma") is None


def test_dream_only_chosen_branch_is_available(db_session, student):
    defn, inst = _surface(db_session, student, "student_dream", "mq11_student_dream_deadline", branch="trip")
    with pytest.raises(HTTPException):
        choose_event(db_session, student, inst.id, _choice(db_session, defn, "Оплатить курс").id)


def test_dream_purchase_spends_cash_and_ends_chain(db_session, student):
    defn, inst = _surface(db_session, student, "student_dream", "mq11_student_dream_deadline", branch="trip")
    cash_before = float(student.cash_balance)
    choose_event(db_session, student, inst.id, _choice(db_session, defn, "Лететь").id)
    db_session.refresh(student)
    assert float(student.cash_balance) == cash_before - 90_000
    assert get_active_chain(db_session, student.id, "student_dream") is None


def test_unlock_card_takes_slot_once_mechanic_is_open(db_session, student, monkeypatch):
    monkeypatch.setattr(
        selection,
        "_progression_context",
        lambda db, pid: {"period_index": 6, "open_capital_mechanics": frozenset({"capital_invest", "capital_insurance"})},
    )
    student.period_index = 6
    db_session.commit()
    ensure_period_events(db_session, student.id, 6, "game")
    keys = {
        d.key
        for d in db_session.query(EventDefinition)
        .join(EventInstance, EventInstance.definition_id == EventDefinition.id)
        .filter(EventInstance.game_profile_id == student.id)
    }
    assert "mq11_student_unlock_insurance" in keys
    assert "mq11_student_unlock_credit" not in keys
