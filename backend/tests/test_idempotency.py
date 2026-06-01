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
