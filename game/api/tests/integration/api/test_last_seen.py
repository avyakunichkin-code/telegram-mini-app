"""PR-17 / PLT-107: last_seen_at у пользователя и D7-прокси в Watchtower."""
from datetime import timedelta

from app.admin.metrics_summary import build_metrics_summary
from app.game.presence import LAST_SEEN_TOUCH_INTERVAL, touch_last_seen
from app.models import GameProfile, User
from app.timeutil import utc_now_naive


def test_bootstrap_sets_last_seen(client, auth_headers, db_session, test_user):
    assert test_user.last_seen_at is None
    assert client.get('/api/game/bootstrap', headers=auth_headers).status_code == 200
    db_session.refresh(test_user)
    assert test_user.last_seen_at is not None
    assert utc_now_naive() - test_user.last_seen_at < timedelta(minutes=1)


def test_touch_is_throttled(db_session, test_user):
    now = utc_now_naive()
    recent = now - LAST_SEEN_TOUCH_INTERVAL / 2
    test_user.last_seen_at = recent
    db_session.commit()
    assert touch_last_seen(db_session, test_user, now=now) is False
    assert test_user.last_seen_at == recent

    stale = now - LAST_SEEN_TOUCH_INTERVAL * 2
    test_user.last_seen_at = stale
    db_session.commit()
    assert touch_last_seen(db_session, test_user, now=now) is True
    assert test_user.last_seen_at == now


def _user(db, name, *, created, last_seen=None, period_index=None):
    user = User(username=name, hashed_password='x', created_at=created, last_seen_at=last_seen)
    db.add(user)
    db.flush()
    if period_index is not None:
        db.add(GameProfile(user_id=user.id, name='p', save_kind='game', period_index=period_index))
    return user


def test_metrics_d7_proxy(db_session):
    now = utc_now_naive()
    old = now - timedelta(days=10)
    # В знаменателе: зарегистрированы ≥7 дней назад и закрыли хотя бы один ход.
    _user(db_session, 'returned', created=old, last_seen=old + timedelta(days=8), period_index=3)
    _user(db_session, 'gone', created=old, last_seen=old + timedelta(days=1), period_index=2)
    _user(db_session, 'never_seen', created=old, period_index=2)
    # Не в знаменателе: ход не закрыт, слишком свежий, нет партии.
    _user(db_session, 'no_close', created=old, last_seen=now, period_index=1)
    _user(db_session, 'fresh', created=now - timedelta(days=2), last_seen=now, period_index=4)
    _user(db_session, 'no_profile', created=old, last_seen=now)
    db_session.commit()

    summary = build_metrics_summary(db_session, days=7)
    assert summary['d7_eligible'] == 3
    assert summary['d7_returned'] == 1
    # Заходили за окно 7 дней: returned (2 дня назад), no_close, fresh, no_profile.
    assert summary['users_seen_recent'] == 4


def test_admin_users_list_exposes_last_seen(client, auth_headers, admin_env, db_session, test_user):
    client.get('/api/game/bootstrap', headers=auth_headers)
    rows = client.get('/api/admin/users', headers=auth_headers).json()['users']
    me = next(r for r in rows if r['id'] == test_user.id)
    assert me['last_seen_at'] is not None
