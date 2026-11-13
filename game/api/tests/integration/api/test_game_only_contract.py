"""ADR-013: removed Plan cannot create or mutate a game; old data is preserved."""
import pytest

from app.models import GameProfile


@pytest.mark.parametrize('template', [None, 'mq_game_basic_v1'])
def test_plan_start_rejected_without_writing(client, auth_headers, db_session, template):
    before = db_session.query(GameProfile).count()
    response = client.post('/api/game/start', headers=auth_headers, json={
        'profile_name': 'Removed mode', 'save_kind': 'plan', 'template_key': template,
    })
    assert response.status_code == 400
    assert db_session.query(GameProfile).count() == before


def test_plan_slot_and_catalog_rejected(client, auth_headers):
    assert client.post('/api/game/profiles', headers=auth_headers,
                       json={'name': 'Removed', 'save_kind': 'plan'}).status_code == 400
    assert client.get('/api/game/templates?for_save_kind=plan', headers=auth_headers).status_code == 400
    templates = client.get('/api/game/templates', headers=auth_headers)
    assert templates.status_code == 200
    assert all(row['template_key'] != 'mq_plan_basic_v1' for row in templates.json())
    assert client.post('/api/game/start', headers=auth_headers, json={
        'profile_name': 'Legacy template', 'save_kind': 'game', 'template_key': 'mq_plan_basic_v1',
    }).status_code == 400


def test_legacy_profile_preserved_but_unavailable(client, auth_headers, db_session, test_user):
    profile = GameProfile(user_id=test_user.id, name='Old Plan', save_kind='plan', is_active=1)
    db_session.add(profile)
    db_session.commit()
    profile_id = profile.id
    assert client.get('/api/game/profiles', headers=auth_headers).json() == []
    for path in ['/api/game/bootstrap', '/api/finance/overview']:
        assert client.get(path, headers=auth_headers).status_code == 410
    assert client.post('/api/game/time/next', headers=auth_headers).status_code == 410
    assert client.post(f'/api/game/profiles/{profile_id}/activate', headers=auth_headers).status_code == 410
    db_session.refresh(profile)
    assert profile.save_kind == 'plan'
    assert profile.is_active == 1


@pytest.mark.parametrize('method,path,payload', [
    ('post', '/api/game/expenses/lines', {'category_key': 'food', 'amount_monthly': 100}),
    ('patch', '/api/game/expenses/lines/1', {'amount_monthly': 200}),
    ('delete', '/api/game/expenses/lines/1', None),
])
def test_expense_mutations_gone_but_game_readable(client, auth_headers, method, path, payload):
    started = client.post('/api/game/start', headers=auth_headers, json={
        'profile_name': 'Game', 'save_kind': 'game', 'template_key': 'mq_game_basic_v1',
    })
    assert started.status_code == 200
    before = client.get('/api/game/expenses', headers=auth_headers).json()
    kwargs = {'headers': auth_headers}
    if payload is not None:
        kwargs['json'] = payload
    assert getattr(client, method)(path, **kwargs).status_code == 410
    response = client.get('/api/game/expenses', headers=auth_headers)
    assert response.status_code == 200
    assert response.json() == before


def test_newer_legacy_profile_does_not_hide_game_save(db_session, test_user):
    from datetime import datetime, timedelta

    from app.game.session import resolve_game_session

    now = datetime(2026, 10, 1)
    game = GameProfile(user_id=test_user.id, name='Game', save_kind='game', is_active=0,
                       updated_at=now - timedelta(days=1))
    legacy = GameProfile(user_id=test_user.id, name='Old Plan', save_kind='plan', is_active=0,
                         updated_at=now)
    db_session.add_all([game, legacy])
    db_session.commit()
    profile, status, _, _ = resolve_game_session(db_session, test_user.id)
    assert profile.id == game.id
    assert status == 'defeated'


def test_removed_plan_detail_is_russian(client, auth_headers, db_session, test_user):
    db_session.add(GameProfile(user_id=test_user.id, name='Old Plan', save_kind='plan', is_active=1))
    db_session.commit()
    response = client.get('/api/game/bootstrap', headers=auth_headers)
    assert response.status_code == 410
    assert 'План' in response.json()['detail']
