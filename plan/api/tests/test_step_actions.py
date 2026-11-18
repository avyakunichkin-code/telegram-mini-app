import json

from test_api_flow import app, client, login, rows, QUICK
from plan_api.analysis import config
from plan_api.repo import Repo


def completed(client, headers):
    ck = client.post('/api/checkups', json={'entry_question': 'overview'}, headers=headers).json()
    client.post(f"/api/checkups/{ck['id']}/quick", json=QUICK, headers=headers)
    report = client.post(f"/api/checkups/{ck['id']}/complete", headers=headers).json()
    step = next(s for s in report['steps'] if s['actions'])
    return ck['id'], step


def test_actions_restore_idempotency_reopen_and_privacy(client, app):
    h = login(client, 'actions@example.com')
    ck, step = completed(client, h)
    snapshot = rows(app, 'SELECT payload_json FROM reports')[0][0]
    base = f"/api/steps/{step['id']}"
    for action in step['actions']:
        response = client.patch(f"{base}/actions/{action['key']}", json={'done': True}, headers=h)
        assert response.status_code == 200, response.text
        again = client.patch(f"{base}/actions/{action['key']}", json={'done': True}, headers=h)
        assert again.json() == response.json()
    saved = client.get(f'/api/checkups/{ck}/report', headers=h).json()
    fresh = next(s for s in saved['steps'] if s['id'] == step['id'])
    assert fresh['status'] == 'done' and all(a['done'] for a in fresh['actions'])
    events = rows(app, "SELECT props_json FROM product_events WHERE name = 'step_action_done'")
    assert len(events) == len(step['actions'])
    assert all(set(json.loads(e[0])) == {'rule_key', 'action'} for e in events)
    assert rows(app, 'SELECT payload_json FROM reports')[0][0] == snapshot
    reopened = client.patch(base, json={'status': 'suggested'}, headers=h).json()
    assert reopened['status'] == 'suggested'
    assert [a['done'] for a in reopened['actions']] == [True] * (len(step['actions']) - 1) + [False]
    key = step['actions'][0]['key']
    unchecked = client.patch(f'{base}/actions/{key}', json={'done': False}, headers=h).json()
    assert unchecked['actions'][0]['done'] is False
    manual = client.patch(base, json={'status': 'done'}, headers=h).json()
    assert manual['actions'] == unchecked['actions']
    assert client.patch(f'{base}/actions/{key}', json={'done': True}, headers=h).status_code == 409


def test_action_auth_validation_legacy_and_dismissed(client, app):
    h = login(client, 'owner@example.com')
    ck, step = completed(client, h)
    other = login(client, 'other@example.com')
    base = f"/api/steps/{step['id']}"
    url = f"{base}/actions/{step['actions'][0]['key']}"
    assert client.patch(url, json={'done': True}).status_code == 401
    assert client.patch(url, json={'done': True}, headers=other).status_code == 404
    assert client.patch(f'{base}/actions/missing', json={'done': True}, headers=h).status_code == 404
    assert client.patch(url, json={'done': 'true'}, headers=h).status_code == 422
    client.patch(base, json={'status': 'dismissed'}, headers=h)
    assert client.patch(url, json={'done': True}, headers=h).status_code == 409
    client.patch(base, json={'status': 'suggested'}, headers=h)
    with app.state.db.session() as session:
        repo = Repo(session)
        payload = {k: v for k, v in step.items() if k != 'actions'}
        repo._exec('UPDATE steps SET payload_json = :p WHERE id = :id', p=json.dumps(payload), id=step['id'])
        repo.commit()
    assert client.patch(url, json={'done': True}, headers=h).status_code == 404
    assert client.patch(base, json={'status': 'done'}, headers=h).json()['status'] == 'done'


def test_stale_update_does_not_overwrite_marks(client, app):
    h = login(client, 'race@example.com')
    _, step = completed(client, h)
    with app.state.db.session() as session:
        repo = Repo(session)
        user = repo.user_by_email('race@example.com')
        previous = repo.step(user, step['id'])
        updated = {**previous, 'actions': [{**a, 'done': True} for a in previous['actions']]}
        assert repo.save_step(user, previous, updated)
        assert not repo.save_step(user, previous, previous)
        repo.commit()


def test_action_catalog_covers_approved_rules():
    assert set(config.STEP_ACTIONS) == {'close_overdue', 'stop_deficit', 'first_cushion', 'avalanche', 'stress_fail', 'goal_unrealistic', 'cushion_target', 'direct_surplus'}
    for actions in config.STEP_ACTIONS.values():
        assert 1 <= len(actions) <= 3
        assert len({key for key, _ in actions}) == len(actions)
