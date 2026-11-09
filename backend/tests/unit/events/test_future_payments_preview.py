import json

from app.events.future_payments import preview_future_payments
from app.events.mvp11_seeds import ensure_mvp11_event_catalog
from app.models import EventChoice, EventDefinition, FinanceSalary, Transaction, EventProfileChain
from tests.fixtures.game import create_game_profile
from tests.unit.events.test_variety_recalibration import instance


def setup_offer(db, user):
    ensure_mvp11_event_catalog(db)
    profile = create_game_profile(db, user_id=user.id, period_index=8,
                                  starter_template_key='mq_game_debt_stack_v1', cash_balance=260000)
    db.add(FinanceSalary(game_profile_id=profile.id, monthly_amount=200000))
    db.commit()
    definition = db.query(EventDefinition).filter_by(key='mq11_family_vacation_offer').one()
    choice = db.query(EventChoice).filter_by(definition_id=definition.id, title='Поехать сейчас по кредитке').one()
    return profile, definition, json.loads(choice.effects_json)


def test_future_alternatives_and_nested_payment_do_not_apply_effects(db_session, test_user):
    profile, definition, effects = setup_offer(db_session, test_user)
    result = preview_future_payments(db_session, profile, effects)
    assert result['version'] == 1 and result['incomplete'] is False
    assert [(r['period_index'], r['cash_delta']) for r in result['payments']] == [
        (11, -150000), (11, -80000), (14, -90000)]
    assert [r['salary_fraction'] for r in result['payments']] == [.75, .4, .45]
    assert all(r['conditional'] for r in result['payments'])
    assert result['payments'][2]['choice_path'] == ['Платить частями', 'Понятно / Закрыть']
    db_session.refresh(profile)
    assert profile.cash_balance == 260000
    assert db_session.query(Transaction).filter_by(game_profile_id=profile.id).count() == 0
    assert db_session.query(EventProfileChain).filter_by(game_profile_id=profile.id).count() == 0


def test_salary_changes_recompute_estimate_and_missing_definition_is_explicit(db_session, test_user):
    profile, _, effects = setup_offer(db_session, test_user)
    salary = db_session.query(FinanceSalary).filter_by(game_profile_id=profile.id).one()
    salary.monthly_amount = 100000
    db_session.flush()
    assert preview_future_payments(db_session, profile, effects)['payments'][0]['cash_delta'] == -75000
    result = preview_future_payments(db_session, profile, {'enqueue_event': {'followup_definition_key': 'missing'}})
    assert result == {'version': 1, 'payments': [], 'incomplete': True}
    assert preview_future_payments(db_session, profile, {})['payments'] == []


def test_pending_json_contract_is_additive_and_authenticated(client, db_session, test_user, auth_headers):
    profile, definition, _ = setup_offer(db_session, test_user)
    instance(db_session, profile, definition)
    response = client.get('/api/game/events/pending', headers=auth_headers)
    assert response.status_code == 200
    event = next(e for e in response.json()['events'] if e['key'] == definition.key)
    card = next(c for c in event['choices'] if c['title'] == 'Поехать сейчас по кредитке')
    assert 'impacts' in card and isinstance(card['id'], int)
    assert card['future_payments']['payments'][0]['cash_delta'] == -150000
    from main import app
    from app.auth import get_current_user
    override = app.dependency_overrides.pop(get_current_user)
    try:
        assert client.get('/api/game/events/pending').status_code in (401, 403)
    finally:
        app.dependency_overrides[get_current_user] = override


def test_branch_context_and_cycles_are_bounded(db_session, test_user):
    profile, _, effects = setup_offer(db_session, test_user)
    bill = db_session.query(EventDefinition).filter_by(key='mq11_family_vacation_card_bill').one()
    choice = db_session.query(EventChoice).filter_by(definition_id=bill.id).order_by(EventChoice.id).first()
    raw = json.loads(choice.effects_json)
    raw['requires_chain_branch'] = 'custom'
    raw['enqueue_event'] = {'followup_definition_key': bill.key, 'after_periods': 1}
    choice.effects_json = json.dumps(raw)
    db_session.flush()
    # Root enqueue context overrides inherited context; explicitly exercise both.
    effects['enqueue_event']['context'] = {}
    hidden = preview_future_payments(db_session, profile, effects)
    assert preview_future_payments(db_session, profile, effects, chain_context={'branch':'custom'}) == hidden
    effects['enqueue_event']['context'] = {'branch':'custom'}
    effects['enqueue_event']['after_periods'] = -3
    shown = preview_future_payments(db_session, profile, effects)
    assert not any(r['cash_delta'] == -150000 for r in hidden['payments'])
    assert any(r['cash_delta'] == -150000 for r in shown['payments'])
    assert shown['incomplete'] is True
    assert shown['payments'][0]['period_index'] == 9
    assert len(shown['payments']) <= 24
