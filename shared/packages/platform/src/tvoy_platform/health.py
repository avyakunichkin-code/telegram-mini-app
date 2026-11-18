"""
`GET /api/health`: 200 при живой БД, 503 при мёртвой — балансировщик смотрит на код, а не на тело (PR-05).

Текст ошибки подключения (хост, DSN) наружу не отдаётся.
"""

from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter
from fastapi.responses import JSONResponse

from .db import Database


def health_router(db: Database, app_name: str, **extra) -> APIRouter:
    router = APIRouter(tags=["health"])

    @router.get("/api/health")
    def health() -> JSONResponse:
        ok = db.ping()
        body = {
            "status": "ok" if ok else "error",
            "app": app_name,
            "database": "connected" if ok else "unavailable",
            "timestamp": datetime.now(timezone.utc).isoformat(timespec="seconds"),
            **extra,
        }
        return JSONResponse(status_code=200 if ok else 503, content=body)

    return router
