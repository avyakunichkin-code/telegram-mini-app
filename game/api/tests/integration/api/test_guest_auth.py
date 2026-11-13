import pytest
from fastapi.testclient import TestClient
from app.auth import get_current_user
from app.models import User, GameProfile, GuestSession
from app.services.guest_auth import COOKIE, _creation_windows
from main import app


@pytest.fixture()
def anonymous(client):
    app.dependency_overrides.pop(get_current_user, None)
    _creation_windows.clear()
    return client


def headers(data):
    return {"Authorization": "Bearer " + data["access_token"]}


def test_guest_resume_claim_preserves_party_and_revokes_old_token(anonymous, db_session):
    c = anonymous
    first = c.post('/api/auth/guest').json()
    assert first['is_guest'] is True
    assert c.post('/api/auth/guest').json()['user_id'] == first['user_id']
    old = headers(first)
    started = c.post('/api/game/guest-start', headers=old, json={
        'profile_name': 'Гостевая история', 'save_kind': 'game', 'template_key': 'mq_game_basic_v1',
    })
    assert started.status_code == 200, started.text
    pid = started.json()['profile_id']
    again = c.post('/api/game/guest-start', headers=old, json={
        'profile_name': 'Повтор', 'save_kind': 'game', 'template_key': 'mq_game_basic_v1',
    })
    assert again.json()['profile_id'] == pid
    before = db_session.get(GameProfile, pid).cash_balance
    claimed = c.post('/api/auth/guest/claim', headers=old, json={
        'email': 'claimed@example.com', 'password': 'password123', 'password_confirm': 'password123',
    })
    assert claimed.status_code == 200, claimed.text
    assert claimed.json()['user_id'] == first['user_id']
    assert claimed.json()['is_guest'] is False
    db_session.expire_all()
    p = db_session.get(GameProfile, pid)
    assert p.user_id == first['user_id'] and p.cash_balance == before
    assert db_session.query(GuestSession).filter_by(user_id=first['user_id']).count() == 0
    assert c.get('/api/user/me', headers=old).status_code == 401
    assert c.get('/api/user/me', headers=headers(claimed.json())).json()['is_guest'] is False
    assert c.post('/api/auth/guest?resume_only=true').status_code == 401
    assert c.post('/api/login', json={'username': 'claimed@example.com', 'password': 'password123'}).status_code == 200


def test_claim_conflict_does_not_erase_guest_and_requires_matching_cookie(anonymous, test_user, db_session):
    c = anonymous
    first = c.post('/api/auth/guest').json()
    auth = headers(first)
    payload = {'email': test_user.email, 'password': 'secret123', 'password_confirm': 'secret123'}
    assert c.post('/api/auth/guest/claim', headers=auth, json=payload).status_code == 409
    assert c.get('/api/user/me', headers=auth).json()['is_guest'] is True
    capability = c.cookies.get(COOKIE)
    c.cookies.clear()
    payload['email'] = 'new@example.com'
    assert c.post('/api/auth/guest/claim', headers=auth, json=payload).status_code == 403
    second = c.post('/api/auth/guest').json()
    assert second['user_id'] != first['user_id']
    assert c.post('/api/auth/guest/claim', headers=auth, json=payload).status_code == 403
    assert c.get('/api/game/profiles', headers=headers(second)).json() == []


def test_guest_cookie_flags_expiry_validation_and_creation_limit(anonymous, db_session):
    from datetime import timedelta
    from app.timeutil import utc_now_naive
    c = anonymous
    response = c.post('/api/auth/guest')
    assert 'HttpOnly' in response.headers['set-cookie']
    assert 'Path=/api/auth/guest' in response.headers['set-cookie']
    first = response.json()
    session = db_session.query(GuestSession).filter_by(user_id=first['user_id']).one()
    assert session.token_hash != c.cookies.get(COOKIE)
    session.expires_at = utc_now_naive() - timedelta(seconds=1)
    db_session.commit()
    assert c.post('/api/auth/guest?resume_only=true').status_code == 401
    for _ in range(19):
        c.cookies.clear()
        assert c.post('/api/auth/guest').status_code == 200
    c.cookies.clear()
    assert c.post('/api/auth/guest').status_code == 429


def test_old_party_keeps_event_period_and_new_guest_uses_v2(anonymous, db_session, test_user):
    from app.game.rules import min_event_period
    assert min_event_period(GameProfile(starter_params_json='{}')) == 3
    c = anonymous
    guest = c.post('/api/auth/guest').json()
    auth = headers(guest)
    pid = c.post('/api/game/start', headers=auth, json={
        'profile_name': 'Quick', 'save_kind': 'game', 'template_key': 'mq_game_basic_v1',
    }).json()['profile_id']
    p = db_session.get(GameProfile, pid)
    assert min_event_period(p) == 1
    guidance = c.get('/api/game/guidance', headers=auth).json()
    assert guidance['onboarding_version'] == 2 and guidance['show_curriculum'] is False
    assert guidance['nudge_id'] == 'quick_salary'
    from app.services.events.spawn import _o2_guidance_replaces_events_intro
    owner = db_session.get(User, guest['user_id'])
    owner.guidance_completed = 1
    db_session.commit()
    assert _o2_guidance_replaces_events_intro(db_session, p) is True


def test_guest_cannot_activate_another_guests_party(anonymous):
    c = anonymous
    first = c.post('/api/auth/guest').json()
    started = c.post('/api/game/guest-start', headers=headers(first))
    assert started.status_code == 200
    pid = started.json()['profile_id']
    c.cookies.clear()
    second = c.post('/api/auth/guest').json()
    response = c.post(f'/api/game/profiles/{pid}/activate', headers=headers(second))
    assert response.status_code == 404
