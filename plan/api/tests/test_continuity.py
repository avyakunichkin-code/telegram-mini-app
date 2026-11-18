import json

import plan_api.main as main_module
from plan_api.repo import Repo
from test_api_flow import app, client, login, rows


def quick(client, h, ck, savings):
    result = client.post(f'/api/checkups/{ck}/quick', headers=h, json={
        'income': {'min': 124000, 'max': 124000}, 'must_expenses': {'min': 100000, 'max': 100000},
        'debt_payments': {'min': 0, 'max': 0}, 'savings': {'min': savings, 'max': savings}, 'children': 0,
    })
    assert result.status_code == 200


def parent(client, h):
    ck = client.post('/api/checkups', headers=h, json={'entry_question': 'overview'}).json()['id']
    quick(client, h, ck, 40000)
    result = client.post(f'/api/checkups/{ck}/complete', headers=h).json()
    return ck, next(s for s in result['steps'] if s['rule_key'] == 'first_cushion')


def test_frozen_parent_status_and_metric_without_parent_recalculation(client, app, monkeypatch):
    h = login(client, 'continuity@example.com')
    old, step = parent(client, h)
    client.patch(f"/api/steps/{step['id']}", headers=h, json={'status': 'done'})
    raw_parent = rows(app, 'SELECT payload_json FROM reports WHERE checkup_id = :id', id=old)[0][0]
    child = client.post('/api/checkups', headers=h, json={'entry_question': 'overview'}).json()['id']
    quick(client, h, child, 120000)
    original = main_module.build_report
    def only_child(ck):
        assert ck.id != old, 'Parent must never be recalculated'
        return original(ck)
    monkeypatch.setattr(main_module, 'build_report', only_child)
    draft = client.get(f'/api/checkups/{child}/report', headers=h).json()
    context = draft['previous_steps']
    assert context['status'] == 'ready' and context['parent_checkup_id'] == old
    primary = context['steps'][0]
    assert primary['rule_key'] == 'first_cushion' and primary['status'] == 'done'
    assert (primary['metric']['before'], primary['metric']['after'], primary['metric']['delta']) == (.4, 1.2, .8)
    final = client.post(f'/api/checkups/{child}/complete', headers={**h, 'Idempotency-Key': 'new'}).json()
    assert final['previous_steps'] == context
    client.patch(f"/api/steps/{step['id']}", headers=h, json={'status': 'suggested'})
    assert client.get(f'/api/checkups/{child}/report', headers=h).json()['previous_steps'] == context
    assert client.post(f'/api/checkups/{child}/complete', headers={**h, 'Idempotency-Key': 'new'}).json()['previous_steps'] == context
    assert rows(app, 'SELECT payload_json FROM reports WHERE checkup_id = :id', id=old)[0][0] == raw_parent


def test_draft_context_updates_but_legacy_final_is_not_retrofitted(client, app):
    h = login(client, 'legacy-context@example.com')
    old, step = parent(client, h)
    # Simulate an existing final report from before P3-03.
    with app.state.db.session() as session:
        r = Repo(session)
        saved = r.report(old); saved.pop('previous_steps')
        r._exec('UPDATE reports SET payload_json = :p WHERE checkup_id = :id', p=json.dumps(saved), id=old)
    assert 'previous_steps' not in client.get(f'/api/checkups/{old}/report', headers=h).json()
    child = client.post('/api/checkups', headers=h, json={'entry_question': 'overview'}).json()['id']
    quick(client, h, child, 120000)
    before = client.get(f'/api/checkups/{child}/report', headers=h).json()['previous_steps']
    assert all(s['status'] == 'suggested' for s in before['steps'])
    client.patch(f"/api/steps/{step['id']}", headers=h, json={'status': 'dismissed'})
    after = client.get(f'/api/checkups/{child}/report', headers=h).json()['previous_steps']
    assert next(s for s in after['steps'] if s['id'] == step['id'])['status'] == 'dismissed'


def test_missing_metrics_versions_legacy_actions_and_isolation(client, app):
    h = login(client, 'unknown-context@example.com')
    other = login(client, 'foreign-context@example.com')
    old, step = parent(client, h)
    foreign, _ = parent(client, other)
    with app.state.db.session() as session:
        r = Repo(session); saved = r.report(old)
        saved['metrics_base'].pop('safety_fund_months'); saved['rules_version'] = 0
        next(s for s in saved['steps'] if s['id'] == step['id']).pop('actions')
        r._exec('UPDATE reports SET payload_json = :p WHERE checkup_id = :id', p=json.dumps(saved), id=old)
        legacy = {k: v for k, v in step.items() if k != 'actions'}
        r._exec('UPDATE steps SET payload_json = :p WHERE id = :id', p=json.dumps(legacy), id=step['id'])
    child = client.post('/api/checkups', headers=h, json={'entry_question': 'overview'}).json()['id']
    quick(client, h, child, 120000)
    result = client.get(f'/api/checkups/{child}/report', headers=h).json()['previous_steps']
    item = next(s for s in result['steps'] if s['id'] == step['id'])
    assert item['metric']['before'] is None and item['metric']['delta'] is None
    assert item['actions_total'] is None and result['versions_differ'] is True
    with app.state.db.session() as session:
        Repo(session)._exec('UPDATE checkups SET parent_checkup_id = :p WHERE id = :id', p=foreign, id=child)
    result = client.get(f'/api/checkups/{child}/report', headers=h).json()['previous_steps']
    assert result == {'status': 'unavailable', 'steps': []}
    assert client.get(f'/api/checkups/{child}/report', headers=other).status_code == 404
    with app.state.db.session() as session:
        Repo(session)._exec('UPDATE checkups SET parent_checkup_id = NULL WHERE id = :id', id=child)
    assert client.get(f'/api/checkups/{child}/report', headers=h).json()['previous_steps'] == {'status': 'none', 'steps': []}
