"""Unit-тесты run_idempotent."""

import json

from app.idempotency import run_idempotent
from app.models import ApiIdempotencyRecord


def test_run_idempotent_replays_stored_response(db_session, test_user):
    calls = {"n": 0}

    def handler():
        calls["n"] += 1
        return {"status": "success", "value": 42}

    status1, body1 = run_idempotent(
        db_session,
        user_id=test_user.id,
        route_key="test.route",
        idempotency_key="key-abc",
        handler=handler,
    )
    status2, body2 = run_idempotent(
        db_session,
        user_id=test_user.id,
        route_key="test.route",
        idempotency_key="key-abc",
        handler=handler,
    )

    assert status1 == 200
    assert body1 == {"status": "success", "value": 42}
    assert body2 == body1
    assert calls["n"] == 1
    assert db_session.query(ApiIdempotencyRecord).count() == 1


def test_run_idempotent_does_not_run_handler_while_key_reserved(db_session, test_user, monkeypatch):
    """Параллельный запрос с тем же ключом уже зарезервировал его — handler не выполняется второй раз."""
    import pytest
    from fastapi import HTTPException

    monkeypatch.setattr("app.idempotency.time.sleep", lambda _s: None)
    db_session.add(
        ApiIdempotencyRecord(
            user_id=test_user.id,
            route_key="test.route",
            idempotency_key="key-busy",
            status_code=200,
            response_json="{}",
        )
    )
    db_session.commit()
    calls = {"n": 0}

    def handler():
        calls["n"] += 1
        return {"status": "success"}

    with pytest.raises(HTTPException) as exc:
        run_idempotent(
            db_session,
            user_id=test_user.id,
            route_key="test.route",
            idempotency_key="key-busy",
            handler=handler,
        )

    assert exc.value.status_code == 409
    assert calls["n"] == 0


def test_run_idempotent_releases_key_when_handler_fails(db_session, test_user):
    import pytest

    def failing():
        db_session.commit()  # handler успел закоммитить резерв и упал
        raise RuntimeError("boom")

    with pytest.raises(RuntimeError):
        run_idempotent(
            db_session,
            user_id=test_user.id,
            route_key="test.route",
            idempotency_key="key-retry",
            handler=failing,
        )

    status, body = run_idempotent(
        db_session,
        user_id=test_user.id,
        route_key="test.route",
        idempotency_key="key-retry",
        handler=lambda: {"status": "success", "retry": True},
    )
    assert status == 200
    assert body == {"status": "success", "retry": True}
    record = db_session.query(ApiIdempotencyRecord).filter_by(idempotency_key="key-retry").one()
    assert json.loads(record.response_json) == body
