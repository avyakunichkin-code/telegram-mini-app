import json

import pytest
from pydantic import ValidationError

import plan_api.main as main_module
import plan_api.repo as repo_module
from plan_api.analytics import EVENT_PROPS, event_props
from plan_api.repo import Repo
from test_api_flow import app, client, login, rows, QUICK


def events(app, name):
    return [json.loads(row[0]) for row in rows(app, 'SELECT props_json FROM product_events WHERE name = :n', n=name)]


def test_server_durations_resume_retries_and_final_view(app, client, monkeypatch):
    h = login(client, 'timing@example.com')
    clock = ['2026-11-05T10:00:00+00:00']
    monkeypatch.setattr(main_module, 'now_iso', lambda **_: clock[0])
    monkeypatch.setattr(repo_module, 'now_iso', lambda **_: clock[0])
    ck = client.post('/api/checkups', json={'entry_question': 'overview'}, headers=h).json()['id']
    # Resume returns the same draft and cannot restart its clock.
    clock[0] = '2026-11-05T10:02:00+00:00'
    assert client.post('/api/checkups', json={'entry_question': 'overview'}, headers=h).json()['id'] == ck
    clock[0] = '2026-11-05T10:03:00+00:00'
    assert client.post(f'/api/checkups/{ck}/quick', json=QUICK, headers=h).status_code == 200
    clock[0] = '2026-11-05T10:04:00+00:00'
    client.post(f'/api/checkups/{ck}/quick', json=QUICK, headers=h)
    assert events(app, 'quick_done') == [{'duration_seconds': 180}]
    assert len(events(app, 'checkup_started')) == 1
    for _ in range(2):
        assert client.put(f'/api/checkups/{ck}/sections/goals', json=[], headers=h).status_code == 200
    assert events(app, 'section_done') == [{'section': 'goals'}]
    client.get(f'/api/checkups/{ck}/report', headers=h)
    clock[0] = '2026-11-05T10:25:00+00:00'
    headers = {**h, 'Idempotency-Key': 'timed'}
    assert client.post(f'/api/checkups/{ck}/complete', headers=headers).status_code == 200
    assert events(app, 'checkup_completed') == [{'duration_seconds': 1500}]
    assert any(p['final'] for p in events(app, 'report_viewed'))
    client.post(f'/api/checkups/{ck}/complete', headers=headers)
    assert len(events(app, 'checkup_completed')) == 1
    nxt = client.post('/api/checkups', json={'entry_question': 'goal'}, headers=h).json()['id']
    clock[0] = '2026-11-05T10:25:05+00:00'
    client.post(f'/api/checkups/{nxt}/quick', json=QUICK, headers=h)
    assert events(app, 'quick_done')[-1] == {'duration_seconds': 5}


@pytest.mark.parametrize('body', [
    {'name': 'unknown', 'props': {}},
    {'name': 'report_viewed', 'props': {'final': True, 'precision': 'draft', 'amount': 150000}},
    {'name': 'report_viewed', 'props': {'final': True, 'precision': 'draft', 'amount': 5}},
    {'name': 'report_viewed', 'props': {'final': True, 'precision': '150000'}},
    {'name': 'report_viewed', 'props': {'final': 1, 'precision': 'draft'}},
    {'name': 'report_viewed', 'props': {'final': True, 'precision': 'draft'}, 'email': 'private@example.com'},
    {'name': 'step_done', 'props': {'rule_key': '150000'}},
    {'name': 'step_action_done', 'props': {'rule_key': 'first_cushion', 'action': 'Перевёл 150000'}},
    {'name': 'quick_done', 'props': {'duration_seconds': 1500}},  # clocks are server-only
    {'name': 'signup', 'props': {}},
    {'name': 'account_deleted', 'props': {}},
])
def test_ingest_rejects_amounts_free_text_and_forged_milestones(client, app, body):
    h = login(client, 'ingest@example.com')
    before = rows(app, 'SELECT COUNT(*) FROM product_events')[0][0]
    assert client.post('/api/events', headers=h, json=body).status_code == 422
    assert rows(app, 'SELECT COUNT(*) FROM product_events')[0][0] == before


def test_event_ingest_auth_and_supported_report_event(client):
    body = {'name': 'report_viewed', 'props': {'final': False, 'precision': 'draft'}}
    assert client.post('/api/events', json=body).status_code == 401
    h = login(client, 'view@example.com')
    assert client.post('/api/events', json=body, headers=h).status_code == 204


def test_privacy_guard_applies_to_internal_producers(app):
    with app.state.db.session() as session:
        repo = Repo(session)
        with pytest.raises(ValidationError):
            repo.track('user', 'step_done', {'rule_key': 'first_cushion', 'amount': 1})
        with pytest.raises(ValueError):
            repo.track('user', 'unknown', {})
        with pytest.raises(ValueError):
            repo.track('user', 'account_deleted', {})
        with pytest.raises(ValueError):
            repo.track(None, 'signup', {})
    for value in [-1, True, '180', 1.5]:
        with pytest.raises(ValidationError):
            event_props('quick_done', {'duration_seconds': value})
    assert event_props('quick_done', {'duration_seconds': 1201}) == {'duration_seconds': 1201}


def test_delete_immediately_erases_own_events_and_keeps_anonymous_count(client, app):
    h = login(client, 'delete-events@example.com')
    uid = client.get('/api/me', headers=h).json()['user']['id']
    other = login(client, 'keep-events@example.com')
    other_id = client.get('/api/me', headers=other).json()['user']['id']
    assert client.delete('/api/me', headers=h).status_code == 202
    assert rows(app, 'SELECT COUNT(*) FROM product_events WHERE user_id = :u', u=uid)[0][0] == 0
    assert rows(app, 'SELECT COUNT(*) FROM product_events WHERE user_id = :u', u=other_id)[0][0] == 2
    assert rows(app, "SELECT user_id, props_json FROM product_events WHERE name = 'account_deleted'") == [(None, '{}')]
    assert client.post('/api/events', headers=h, json={'name': 'report_viewed', 'props': {'final': False, 'precision': 'draft'}}).status_code == 401
    with app.state.db.session() as session:
        assert Repo(session).purge_deleted() == 1
    assert events(app, 'account_deleted') == [{}]


def test_closed_catalog_has_exactly_approved_events():
    assert set(EVENT_PROPS) == {'signup', 'consent_accepted', 'checkup_started', 'quick_done', 'section_done', 'report_viewed', 'checkup_completed', 'step_done', 'step_dismissed', 'step_action_done', 'account_deleted'}


def test_all_approved_events_are_emitted_by_real_operations(client, app):
    h = login(client, 'lifecycle@example.com')
    ck = client.post('/api/checkups', json={'entry_question': 'overview'}, headers=h).json()['id']
    client.post(f'/api/checkups/{ck}/quick', json=QUICK, headers=h)
    client.put(f'/api/checkups/{ck}/sections/goals', json=[], headers=h)
    report = client.post(f'/api/checkups/{ck}/complete', headers=h).json()
    step = next(s for s in report['steps'] if s['actions'])
    url = f"/api/steps/{step['id']}"
    client.patch(url, json={'status': 'dismissed'}, headers=h)
    client.patch(url, json={'status': 'suggested'}, headers=h)
    for action in step['actions']:
        assert client.patch(f"{url}/actions/{action['key']}", json={'done': True}, headers=h).status_code == 200
    before_delete = {r[0] for r in rows(app, 'SELECT DISTINCT name FROM product_events')}
    assert before_delete == set(EVENT_PROPS) - {'account_deleted'}
    for name, props in rows(app, 'SELECT name, props_json FROM product_events'):
        assert event_props(name, json.loads(props)) == json.loads(props)
    client.delete('/api/me', headers=h)
    assert rows(app, 'SELECT name FROM product_events') == [('account_deleted',)]
