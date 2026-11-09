import copy

import pytest

from app.events.choice_snapshot import attach_event_instance_choice_snapshot, parse_choice_snapshot
from app.events.mvp11_seeds import MVP11_EVENT_SPECS, _sync_mvp11_spec, ensure_mvp11_event_catalog
from app.game.rules import EventProfileCounterSnapshot, is_event_definition_eligible
from app.models import EventChoice, EventDefinition, EventInstance, EventProfileChain, FinanceSalary, FinanceLiability
from app.services.events.choose import choose_event
from app.services.events.payload import serialize_instance_rows
from app.services.events.spawn import ensure_period_events
from tests.fixtures.game import create_game_profile


KEY='mq11_family_vacation_offer'
TITLE='Короткий отдых рядом с домом'


def instance(db, profile, definition):
    inst=EventInstance(game_profile_id=profile.id,period_index=profile.period_index,definition_id=definition.id,status='pending')
    db.add(inst);db.flush();attach_event_instance_choice_snapshot(db,profile,definition,inst);db.commit()
    return inst


@pytest.mark.parametrize('salary',[62500,200000])
def test_budget_rest_preview_matches_cash_once_without_hidden_credit(db_session,test_user,salary):
    ensure_mvp11_event_catalog(db_session)
    profile=create_game_profile(db_session,user_id=test_user.id,cash_balance=300000,period_index=12,starter_template_key='mq_game_debt_stack_v1')
    db_session.add(FinanceSalary(game_profile_id=profile.id,monthly_amount=salary));db_session.commit()
    definition=db_session.query(EventDefinition).filter_by(key=KEY).one()
    inst=instance(db_session,profile,definition)
    payload=serialize_instance_rows(db_session,[inst],profile=profile)[0]
    choice=next(ch for ch in payload['choices'] if ch['title']==TITLE)
    cash=next(impact for impact in choice['impacts'] if impact['kind']=='cash')
    expected=salary*.12
    assert cash['delta']==pytest.approx(-expected)
    choose_event(db_session,profile,inst.id,choice['id']);db_session.refresh(profile)
    assert profile.cash_balance==pytest.approx(300000-expected)
    assert db_session.query(EventProfileChain).filter_by(game_profile_id=profile.id).count()==0
    choose_event(db_session,profile,inst.id,choice['id']);db_session.refresh(profile)
    assert profile.cash_balance==pytest.approx(300000-expected)


def test_catalog_upgrade_preserves_old_three_choice_snapshot(db_session,test_user):
    ensure_mvp11_event_catalog(db_session)
    definition=db_session.query(EventDefinition).filter_by(key=KEY).one()
    old=copy.deepcopy(next(s for s in MVP11_EVENT_SPECS if s['key']==KEY));old['choices']=old['choices'][:3]
    _sync_mvp11_spec(db_session,old,definition);db_session.commit()
    old_ids=[ch.id for ch in db_session.query(EventChoice).filter_by(definition_id=definition.id).order_by(EventChoice.id)]
    assert len(old_ids)==3
    profile=create_game_profile(db_session,user_id=test_user.id,period_index=12,starter_template_key='mq_game_debt_stack_v1')
    old_inst=instance(db_session,profile,definition)
    ensure_mvp11_event_catalog(db_session)
    new_ids=[ch.id for ch in db_session.query(EventChoice).filter_by(definition_id=definition.id).order_by(EventChoice.id)]
    assert new_ids[:3]==old_ids and len(new_ids)==4
    assert parse_choice_snapshot(old_inst)==set(old_ids)
    old_payload=serialize_instance_rows(db_session,[old_inst],profile=profile)[0]
    assert all(ch['title']!=TITLE for ch in old_payload['choices'])
    new_inst=instance(db_session,profile,definition)
    assert parse_choice_snapshot(new_inst)==set(new_ids)
    ensure_mvp11_event_catalog(db_session)
    assert [ch.id for ch in db_session.query(EventChoice).filter_by(definition_id=definition.id).order_by(EventChoice.id)]==new_ids


def test_broken_card_story_is_preserved_but_not_spawned(db_session,test_user,monkeypatch):
    ensure_mvp11_event_catalog(db_session)
    card=db_session.query(EventDefinition).filter_by(key='mq11_card_minimum_entrepreneur').one()
    assert card.is_active==0
    ids=[ch.id for ch in db_session.query(EventChoice).filter_by(definition_id=card.id)]
    assert len(ids)==3
    ensure_mvp11_event_catalog(db_session);db_session.refresh(card)
    assert card.is_active==0
    assert [ch.id for ch in db_session.query(EventChoice).filter_by(definition_id=card.id)]==ids
    profile=create_game_profile(db_session,user_id=test_user.id,cash_balance=500000,period_index=3,starter_template_key='mq_game_debt_stack_v1')
    # The profile really has a card; if the active filter is accidentally dropped,
    # equal draws and this high weight would select the broken definition.
    db_session.add(FinanceLiability(game_profile_id=profile.id,title='Card',total_debt=150000,
        annual_rate_percent=24,monthly_payment=3000,liability_kind='consumer',payment_mode='interest_only'))
    card.weight=50000;db_session.commit()
    monkeypatch.setattr('app.services.events.selection.random.random',lambda:0.5)
    ensure_period_events(db_session,profile.id,3,'game')
    assert db_session.query(EventInstance).filter_by(game_profile_id=profile.id,definition_id=card.id).count()==0


def test_course_cannot_repeat_during_its_six_period_cooldown(db_session):
    ensure_mvp11_event_catalog(db_session)
    course=db_session.query(EventDefinition).filter_by(key='mq11_evening_course').one()
    counter=EventProfileCounterSnapshot(times_selected=1,last_selected_period_index=11)
    args=dict(repeat_policy=course.repeat_policy,repeat_max=course.repeat_max,cooldown_periods=course.cooldown_periods,counter=counter)
    assert not is_event_definition_eligible(current_period_index=16,**args)
    assert is_event_definition_eligible(current_period_index=17,**args)
