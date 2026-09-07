"""
Идемпотентность денежных POST: заголовок Idempotency-Key и естественные повторы (зарплата).
"""

from __future__ import annotations

import json
import time
from typing import Any, Callable

from fastapi import HTTPException, Request
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from .models import ApiIdempotencyRecord

IDEMPOTENCY_HEADER = "Idempotency-Key"
MAX_KEY_LENGTH = 128


def read_idempotency_key(request: Request) -> str | None:
    raw = (request.headers.get(IDEMPOTENCY_HEADER) or "").strip()
    if not raw:
        return None
    if len(raw) > MAX_KEY_LENGTH:
        raise HTTPException(status_code=400, detail=f"{IDEMPOTENCY_HEADER} too long (max {MAX_KEY_LENGTH})")
    return raw


def run_idempotent(
    db: Session,
    *,
    user_id: int,
    route_key: str,
    idempotency_key: str | None,
    handler: Callable[[], dict[str, Any]],
    success_status: int = 200,
) -> tuple[int, dict[str, Any]]:
    """
    Если передан idempotency_key — сохраняет успешный JSON-ответ и отдаёт его при повторе.
    handler должен выполнить commit внутри.
    """
    if idempotency_key:
        existing = (
            db.query(ApiIdempotencyRecord)
            .filter(
                ApiIdempotencyRecord.user_id == user_id,
                ApiIdempotencyRecord.route_key == route_key,
                ApiIdempotencyRecord.idempotency_key == idempotency_key,
            )
            .first()
        )
        if existing:
            try:
                body = json.loads(existing.response_json or "{}")
            except json.JSONDecodeError:
                body = {}
            return int(existing.status_code), body

    body = handler()

    if idempotency_key:
        db.add(
            ApiIdempotencyRecord(
                user_id=user_id,
                route_key=route_key,
                idempotency_key=idempotency_key,
                status_code=success_status,
                response_json=json.dumps(body, ensure_ascii=False),
            )
        )
        db.commit()

    return success_status, body


def load_stored_body(
    db: Session, *, user_id: int, route_key: str, idempotency_key: str
) -> dict[str, Any] | None:
    record = (
        db.query(ApiIdempotencyRecord)
        .filter(
            ApiIdempotencyRecord.user_id == user_id,
            ApiIdempotencyRecord.route_key == route_key,
            ApiIdempotencyRecord.idempotency_key == idempotency_key,
        )
        .first()
    )
    if not record or not record.response_json or record.response_json == "{}":
        return None
    try:
        data = json.loads(record.response_json)
    except json.JSONDecodeError:
        return None
    return data if isinstance(data, dict) and data else None


def store_body(
    db: Session,
    *,
    user_id: int,
    route_key: str,
    idempotency_key: str,
    body: dict[str, Any],
    status_code: int = 200,
) -> None:
    payload = json.dumps(body, ensure_ascii=False)
    record = (
        db.query(ApiIdempotencyRecord)
        .filter(
            ApiIdempotencyRecord.user_id == user_id,
            ApiIdempotencyRecord.route_key == route_key,
            ApiIdempotencyRecord.idempotency_key == idempotency_key,
        )
        .first()
    )
    if record:
        record.status_code = status_code
        record.response_json = payload
    else:
        db.add(
            ApiIdempotencyRecord(
                user_id=user_id,
                route_key=route_key,
                idempotency_key=idempotency_key,
                status_code=status_code,
                response_json=payload,
            )
        )
    db.commit()


def try_reserve_key(
    db: Session, *, user_id: int, route_key: str, idempotency_key: str
) -> bool:
    """True, если этот запрос владеет ключом. False — ключ уже занят."""
    try:
        with db.begin_nested():
            db.add(
                ApiIdempotencyRecord(
                    user_id=user_id,
                    route_key=route_key,
                    idempotency_key=idempotency_key,
                    status_code=200,
                    response_json="{}",
                )
            )
            db.flush()
        return True
    except IntegrityError:
        db.rollback()
        return False


def wait_stored_body(
    db: Session,
    *,
    user_id: int,
    route_key: str,
    idempotency_key: str,
    attempts: int = 20,
    delay_s: float = 0.05,
) -> dict[str, Any] | None:
    body = load_stored_body(
        db, user_id=user_id, route_key=route_key, idempotency_key=idempotency_key
    )
    if body:
        return body
    for _ in range(attempts):
        time.sleep(delay_s)
        db.rollback()
        body = load_stored_body(
            db, user_id=user_id, route_key=route_key, idempotency_key=idempotency_key
        )
        if body:
            return body
    return None
