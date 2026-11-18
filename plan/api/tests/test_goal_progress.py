import json

from plan_api.repo import Repo
from test_api_flow import app, client, login, rows
from test_continuity import quick


def create(client, h):
    ck = client.post('/api/checkups', headers=h, json={'entry_question': 'goal'}).json()['id']
    quick(client, h, ck, 120000)
    return ck


def month(app, ck, value):
    with app.state.db.session() as session:
        Repo(session)._exec('UPDATE checkups SET as_of = :m WHERE id = :id', m=value, id=ck)


def put(client, h, ck, goals):
    r = client.put(f'/api/checkups/{ck}/sections/goals', headers=h, json=goals)
    assert r.status_code == 200, r.text
    return r.json()


def goal(**kwargs):
    return {'title': 'Первый взнос', 'target_amount': 1200000, 'saved_amount': 240000, 'target_month': '2029-11', **kwargs}


def test_goal_identity_rename_delta_and_frozen_report(client, app):
    h = login(client, 'goals@example.com')
    old = create(client, h); month(app, old, '2026-08')
    goals = put(client, h, old, [goal()]); gid = goals[0]['id']
    parent = client.post(f'/api/checkups/{old}/complete', headers=h).json()
    raw = rows(app, 'SELECT payload_json FROM reports WHERE checkup_id=:id', id=old)[0][0]
    child = create(client, h); month(app, child, '2026-11')
    copied = client.get(f'/api/checkups/{child}', headers=h).json()['data']['goals'][0]
    assert copied['id'] == gid
    put(client, h, child, [{**copied, 'title': 'Квартира', 'saved_amount': 300000}])
    result = client.post(f'/api/checkups/{child}/complete', headers={**h, 'Idempotency-Key': 'goal'}).json()
    p = result['goals'][0]['progress']
    assert (p['before'], p['delta'], p['months'], p['observed_monthly'], p['estimated_month']) == (240000, 60000, 3, 20000, '2030-08')
    assert p['previous_estimated_month'] == parent['goals'][0]['realistic_month']
    assert result['goals'][0]['monthly_needed'] == 25000
    assert rows(app, 'SELECT payload_json FROM reports WHERE checkup_id=:id', id=old)[0][0] == raw
    with app.state.db.session() as session:
        r = Repo(session); saved = r.report(old); saved['goals'][0]['saved_amount'] = 1
        r._exec('UPDATE reports SET payload_json=:p WHERE checkup_id=:id', p=json.dumps(saved), id=old)
    assert client.get(f'/api/checkups/{child}/report', headers=h).json()['goals'] == result['goals']
    assert client.post(f'/api/checkups/{child}/complete', headers={**h, 'Idempotency-Key': 'goal'}).json()['goals'] == result['goals']


def test_same_month_missing_deadline_duplicate_ids_and_isolation(client, app):
    h = login(client, 'goals-boundary@example.com')
    old = create(client, h)
    goals = put(client, h, old, [goal(target_month=None)])
    final = client.post(f'/api/checkups/{old}/complete', headers=h).json()
    assert final['goals'][0]['monthly_needed'] is None
    assert final['goals'][0]['realistic'] is None
    assert final['areas'][2]['metrics']['goals_realistic'] is None
    child = create(client, h)
    assert client.put(f'/api/checkups/{child}/sections/goals', headers=h, json=goals*2).status_code == 422
    assert client.put(f'/api/checkups/{child}/sections/goals', headers=h, json=[goal(id='invented')]).status_code == 422
    put(client, h, child, [{**goals[0], 'saved_amount': 250000}])
    p = client.get(f'/api/checkups/{child}/report', headers=h).json()['goals'][0]['progress']
    assert p['delta'] == 10000 and p['observed_monthly'] is None and p['estimated_month'] is None
    other = login(client, 'other-goal@example.com')
    assert client.get(f'/api/checkups/{child}/report', headers=other).status_code == 404
    foreign = create(client, other)
    client.post(f'/api/checkups/{foreign}/complete', headers=other)
    with app.state.db.session() as session:
        r = Repo(session)
        r._exec('UPDATE checkups SET parent_checkup_id=:p WHERE id=:id', p=foreign, id=child)
    assert client.get(f'/api/checkups/{child}/report', headers=h).json()['goals'][0]['progress']['before'] is None


def test_decline_achievement_changed_target_and_legacy(client, app):
    h = login(client, 'goals-states@example.com')
    old = create(client, h); month(app, old, '2026-08')
    goals = put(client, h, old, [goal(), goal(title='Другая', saved_amount=100)])
    client.post(f'/api/checkups/{old}/complete', headers=h)
    child = create(client, h); month(app, child, '2026-11')
    put(client, h, child, [{**goals[1], 'saved_amount': 1200000}, {**goals[0], 'saved_amount': 210000, 'target_amount': 1500000}])
    report = client.get(f'/api/checkups/{child}/report', headers=h).json()
    by_id = {g['id']: g['progress'] for g in report['goals']}
    assert by_id[goals[1]['id']]['achieved'] is True
    p = by_id[goals[0]['id']]
    assert p['delta'] == -30000 and p['estimated_month'] is None and p['target_changed']
    with app.state.db.session() as session:
        r = Repo(session); saved = r.report(old)
        for g in saved['goals']: g.pop('id')
        r._exec('UPDATE reports SET payload_json=:p WHERE checkup_id=:id', p=json.dumps(saved), id=old)
    report = client.get(f'/api/checkups/{child}/report', headers=h).json()
    assert all(g['progress']['before'] is None for g in report['goals'])


def test_estimate_uses_unrounded_pace_and_recreated_goal_is_new(client, app):
    h = login(client, 'goals-rounding@example.com')
    old = create(client, h); month(app, old, '2026-08')
    goals = put(client, h, old, [goal(saved_amount=0, target_amount=20000)])
    client.post(f'/api/checkups/{old}/complete', headers=h)
    child = create(client, h); month(app, child, '2026-11')
    put(client, h, child, [{**goals[0], 'saved_amount': 10000}])
    p = client.get(f'/api/checkups/{child}/report', headers=h).json()['goals'][0]['progress']
    assert p['observed_monthly'] == 3333.33 and p['estimated_month'] == '2027-02'
    put(client, h, child, [goal(saved_amount=10000, target_amount=20000)])
    p = client.get(f'/api/checkups/{child}/report', headers=h).json()['goals'][0]['progress']
    assert p['before'] is None and p['delta'] is None
