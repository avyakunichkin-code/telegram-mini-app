"""
Идемпотентность денежных POST: заголовок Idempotency-Key и естественные повторы (зарплата).
"""

from __future__ import annotations

import json
from typing import Any, Callable

from fastapi import HTTPException, Request
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
