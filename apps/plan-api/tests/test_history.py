import json

import plan_api.main as main_module
from test_api_flow import app, client, login, rows
from plan_api.repo import Repo


def make(client, app, h, at, income=200000, savings=100000):
    ck = client.post('/api/checkups', json={'entry_question': 'overview'}, headers=h).json()['id']
    client.post(f'/api/checkups/{ck}/quick', headers=h, json={
        'income': {'min': income, 'max': income}, 'must_expenses': {'min': 100000, 'max': 100000},
        'debt_payments': {'min': 0, 'max': 0}, 'savings': {'min': savings, 'max': savings}, 'children': 0,
    })
    report = client.post(f'/api/checkups/{ck}/complete', headers=h).json()
    with app.state.db.session() as session:
        Repo(session)._exec('UPDATE checkups SET completed_at = :at WHERE id = :id', at=at, id=ck)
    return ck, report


def test_history_and_compare_are_read_only_saved_snapshots(client, app, monkeypatch):
    h = login(client, 'history@example.com')
    old, a = make(client, app, h, '2026-10-01T00:00:00+00:00')
    new, b = make(client, app, h, '2026-11-01T00:00:00+00:00', income=220000, savings=200000)
    raw_before = rows(app, 'SELECT payload_json FROM reports ORDER BY id')
    def forbidden(*args, **kwargs):
        raise AssertionError('Saved reports must never be recalculated')
    monkeypatch.setattr(main_module, 'build_report', forbidden)
    history = client.get('/api/checkups', headers=h).json()
    assert [c['id'] for c in history] == [new, old]
    assert history[0]['report_available'] is True
    assert history[1]['areas'] == [{'key': x['key'], 'title': x['title'], 'light': x['light']} for x in a['areas']]
    response = client.get(f'/api/checkups/{new}/compare/{old}', headers=h)
    assert response.status_code == 200, response.text
    result = response.json()
    assert result['before']['checkup_id'] == old and result['after']['checkup_id'] == new
    assert len(result['metrics']) == 5 and len(result['after']['areas']) == 4
    cash = result['metrics'][0]
    assert (cash['before'], cash['after'], cash['delta']) == (100000, 120000, 20000)
    assert result['metrics'][1]['delta'] == 1
    assert result['versions_differ'] is False
    assert client.get(f'/api/checkups/{old}/report', headers=h).json()['free_cashflow'] == a['free_cashflow']
    assert rows(app, 'SELECT payload_json FROM reports ORDER BY id') == raw_before


def test_isolation_drafts_missing_snapshot_and_order(client, app):
    owner = login(client, 'owner-history@example.com')
    other = login(client, 'other-history@example.com')
    old, _ = make(client, app, owner, '2026-10-01T00:00:00+00:00')
    new, _ = make(client, app, owner, '2026-11-01T00:00:00+00:00')
    foreign, _ = make(client, app, other, '2026-11-02T00:00:00+00:00')
    assert client.get(f'/api/checkups/{new}/compare/{old}').status_code == 401
    assert client.get(f'/api/checkups/{new}/compare/{foreign}', headers=owner).status_code == 404
    assert client.get(f'/api/checkups/{foreign}/compare/{old}', headers=owner).status_code == 404
    assert client.get(f'/api/checkups/{new}/compare/missing', headers=owner).status_code == 404
    assert client.get(f'/api/checkups/{new}/compare/{new}', headers=owner).status_code == 422
    assert client.get(f'/api/checkups/{old}/compare/{new}', headers=owner).status_code == 422
    draft = client.post('/api/checkups', json={'entry_question': 'goal'}, headers=owner).json()['id']
    assert client.get(f'/api/checkups/{draft}/compare/{old}', headers=owner).status_code == 422
    item = next(c for c in client.get('/api/checkups', headers=owner).json() if c['id'] == draft)
    assert item['areas'] is None and item['report_available'] is False
    assert all(c['id'] != foreign for c in client.get('/api/checkups', headers=owner).json())
    with app.state.db.session() as session:
        Repo(session)._exec('DELETE FROM reports WHERE checkup_id = :id', id=old)
    assert client.get(f'/api/checkups/{new}/compare/{old}', headers=owner).status_code == 409
    assert client.get(f'/api/checkups/{old}/report', headers=owner).status_code == 409
    assert next(c for c in client.get('/api/checkups', headers=owner).json() if c['id'] == old)['report_available'] is False


def test_old_metrics_remain_unknown_and_versions_are_explicit(client, app):
    h = login(client, 'versions@example.com')
    old, report = make(client, app, h, '2026-10-01T00:00:00+00:00')
    new, _ = make(client, app, h, '2026-11-01T00:00:00+00:00')
    del report['net_worth']
    report['rules_version'] = 0
    with app.state.db.session() as session:
        Repo(session)._exec('UPDATE reports SET payload_json = :p WHERE checkup_id = :id', p=json.dumps(report), id=old)
    result = client.get(f'/api/checkups/{new}/compare/{old}', headers=h).json()
    assert result['versions_differ'] is True
    metric = next(m for m in result['metrics'] if m['key'] == 'net_worth')
    assert metric['before'] is None and metric['delta'] is None
    assert result['before']['rules_version'] == 0
