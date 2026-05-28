"""Admin Watchtower API (MVP 1.2 A0) — read-only, allowlist."""

from __future__ import annotations

import json
from datetime import datetime
from typing import Any, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..admin.auth import require_admin_user
from ..admin.catalogs import fetch_catalog_rows, get_catalog_spec, list_catalog_meta
from ..admin.onboarding_funnel import build_onboarding_funnel
from ..database import get_db
from ..models import GameProfile, NotificationLog, User

router = APIRouter(prefix="/api/admin", tags=["admin"])


class AdminUserRow(BaseModel):
    id: int
    username: str
    telegram_id: Optional[int] = None
    created_at: Optional[datetime] = None
    profiles_count: int = 0


class AdminProfileRow(BaseModel):
    id: int
    user_id: int
    username: str
    name: str
    save_kind: str
    starter_template_key: Optional[str] = None
    is_active: bool
    period_index: int
    cash_balance: float
    onboarding_state: str = "brief_done"
    onboarding_step: str = "farewell"
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class AdminOnboardingFunnelStep(BaseModel):
    step: str
    label: str
    current_count: int
    reached_count: int


class AdminOnboardingFunnel(BaseModel):
    started_profiles: int
    draft_profiles: int
    brief_done_profiles: int
    completion_rate_pct: float
    steps: List[AdminOnboardingFunnelStep]


class AdminNotificationRow(BaseModel):
    id: int
    kind: str
    user_id: Optional[int] = None
    game_profile_id: Optional[int] = None
    payload: dict[str, Any]
    telegram_sent: bool
    created_at: Optional[datetime] = None


class AdminWatchtowerResponse(BaseModel):
    users: List[AdminUserRow]
    profiles: List[AdminProfileRow]
    notifications: List[AdminNotificationRow]
    onboarding_funnel: AdminOnboardingFunnel


class AdminCatalogColumn(BaseModel):
    key: str
    label: str


class AdminCatalogMeta(BaseModel):
    key: str
    title: str
    columns: List[AdminCatalogColumn]


class AdminCatalogRowsResponse(BaseModel):
    catalog_key: str
    title: str
    columns: List[AdminCatalogColumn]
    rows: List[dict[str, Any]]
    total: int
    limit: int


@router.get("/catalogs", response_model=list[AdminCatalogMeta])
async def admin_list_catalogs(
    _admin: User = Depends(require_admin_user),
):
    return list_catalog_meta()


@router.get("/catalogs/{catalog_key}/rows", response_model=AdminCatalogRowsResponse)
async def admin_catalog_rows(
    catalog_key: str,
    q: str = Query("", max_length=120),
    active_only: bool = Query(False),
    limit: int = Query(200, ge=1, le=500),
    _admin: User = Depends(require_admin_user),
    db: Session = Depends(get_db),
):
    spec = get_catalog_spec(catalog_key)
    if spec is None:
        raise HTTPException(status_code=404, detail="Unknown catalog")
    _, rows, total = fetch_catalog_rows(
        db,
        catalog_key,
        q=q,
        active_only=active_only,
        limit=limit,
    )
    return AdminCatalogRowsResponse(
        catalog_key=spec.key,
        title=spec.title,
        columns=[AdminCatalogColumn(key=c.key, label=c.label) for c in spec.columns],
        rows=rows,
        total=total,
        limit=limit,
    )


@router.get("/watchtower", response_model=AdminWatchtowerResponse)
async def admin_watchtower(
    user_limit: int = Query(50, ge=1, le=200),
    profile_limit: int = Query(50, ge=1, le=200),
    notification_limit: int = Query(100, ge=1, le=500),
    _admin: User = Depends(require_admin_user),
    db: Session = Depends(get_db),
):
    users = db.query(User).order_by(User.id.desc()).limit(user_limit).all()
    profiles = (
        db.query(GameProfile, User.username)
        .join(User, User.id == GameProfile.user_id)
        .order_by(GameProfile.updated_at.desc())
        .limit(profile_limit)
        .all()
    )
    notifications = (
        db.query(NotificationLog)
        .filter(NotificationLog.audience == "admin")
        .order_by(NotificationLog.id.desc())
        .limit(notification_limit)
        .all()
    )

    user_ids = [u.id for u in users]
    profile_counts: dict[int, int] = {uid: 0 for uid in user_ids}
    if user_ids:
        for uid, cnt in (
            db.query(GameProfile.user_id, func.count(GameProfile.id))
            .filter(GameProfile.user_id.in_(user_ids))
            .group_by(GameProfile.user_id)
            .all()
        ):
            profile_counts[int(uid)] = int(cnt)

    return AdminWatchtowerResponse(
        users=[
            AdminUserRow(
                id=u.id,
                username=u.username,
                telegram_id=u.telegram_id,
                created_at=u.created_at,
                profiles_count=profile_counts.get(u.id, 0),
            )
            for u in users
        ],
        profiles=[
            AdminProfileRow(
                id=p.id,
                user_id=p.user_id,
                username=username,
                name=p.name,
                save_kind=p.save_kind,
                starter_template_key=p.starter_template_key,
                is_active=bool(p.is_active),
                period_index=int(p.period_index),
                cash_balance=round(float(p.cash_balance or 0), 2),
                onboarding_state=str(getattr(p, "onboarding_state", "brief_done") or "brief_done"),
                onboarding_step=str(getattr(p, "onboarding_step", "farewell") or "farewell"),
                created_at=p.created_at,
                updated_at=p.updated_at,
            )
            for p, username in profiles
        ],
        onboarding_funnel=AdminOnboardingFunnel(**build_onboarding_funnel(db)),
        notifications=[
            AdminNotificationRow(
                id=n.id,
                kind=n.kind,
                user_id=n.user_id,
                game_profile_id=n.game_profile_id,
                payload=_parse_payload(n.payload_json),
                telegram_sent=bool(n.telegram_sent),
                created_at=n.created_at,
            )
            for n in notifications
        ],
    )


def _parse_payload(raw: str) -> dict[str, Any]:
    try:
        data = json.loads(raw or "{}")
        return data if isinstance(data, dict) else {}
    except json.JSONDecodeError:
        return {}
