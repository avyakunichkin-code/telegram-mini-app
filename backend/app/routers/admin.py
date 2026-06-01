"""Admin Watchtower API (MVP 1.2 A0) — read-only, allowlist."""

from __future__ import annotations

import json
from datetime import datetime
from typing import Any, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..admin.auth import require_admin_user
from ..admin.catalog_detail import get_catalog_row_detail
from ..admin.catalog_patch import patch_catalog_row
from ..admin.catalog_choices import (
    create_event_choice,
    delete_event_choice,
    list_event_choices,
    patch_event_choice,
)
from ..admin.catalog_create_payload import create_catalog_row_payload
from ..admin.catalog_write import clone_catalog_row, create_catalog_row
from ..admin.catalogs import fetch_catalog_rows, get_catalog_spec, list_catalog_meta
from ..admin.csv_export import profiles_csv_rows, run_feedback_csv_rows, stream_csv
from ..admin.metrics_summary import build_metrics_summary
from ..admin.watchtower_profiles import build_admin_profile_row, fetch_profile_rows
from ..admin.onboarding_funnel import build_onboarding_funnel
from ..admin.profile_inspector import build_profile_inspector
from ..admin.run_feedback import build_run_feedback_rows
from ..admin.stuck_scan import scan_stuck_and_emit
from ..admin.notify_messages import format_alert_message_ru, kind_label_ru
from ..database import get_db
from ..models import EventDefinition, GameProfile, NotificationLog, User

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
    is_archived: bool = False
    run_outcome: Optional[str] = None
    run_outcome_label: Optional[str] = None
    period_index: int
    cash_balance: float
    onboarding_state: str = "brief_done"
    onboarding_step: str = "farewell"
    guidance_completed: bool = False
    guidance_current_beat: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    stuck_kind: Optional[str] = None


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
    guidance_mode: str = "o2"


class AdminNotificationRow(BaseModel):
    id: int
    kind: str
    kind_label: str
    summary: str
    user_id: Optional[int] = None
    game_profile_id: Optional[int] = None
    payload: dict[str, Any]
    telegram_sent: bool
    created_at: Optional[datetime] = None


class AdminRunFeedbackRow(BaseModel):
    id: int
    user_id: int
    username: str
    game_profile_id: int
    profile_name: str
    outcome: str
    outcome_label: str
    template_key: Optional[str] = None
    period_index: int
    defeat_reason: Optional[str] = None
    comment: str
    comment_preview: str
    created_at: Optional[datetime] = None


class AdminMetricsSummary(BaseModel):
    window_days: int
    users_total: int
    users_recent: int
    profiles_total: int
    profiles_active: int
    profiles_recent: int
    users_with_profiles: int
    guidance_in_progress: int
    guidance_completed_total: int
    guidance_completed_recent: int
    wins_total: int
    wins_recent: int
    avg_period_index_active: float
    game_started_recent: int
    defeats_total: int = 0
    defeats_recent: int = 0
    run_feedback_recent: int = 0
    profiles_period_3_plus_total: int = 0
    profiles_period_3_plus_active: int = 0


class AdminPendingEventRow(BaseModel):
    id: int
    title: str
    event_slot: Optional[str] = None
    content_class: Optional[str] = None


class AdminLatestRunFeedback(BaseModel):
    id: int
    outcome: str
    outcome_label: str
    template_key: Optional[str] = None
    period_index: int
    defeat_reason: Optional[str] = None
    comment: str
    created_at: Optional[datetime] = None


class AdminWatchtowerResponse(BaseModel):
    users: List[AdminUserRow]
    profiles: List[AdminProfileRow]
    notifications: List[AdminNotificationRow]
    run_feedback: List[AdminRunFeedbackRow] = []
    onboarding_funnel: AdminOnboardingFunnel
    metrics_summary: AdminMetricsSummary


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


class AdminCatalogCreateRequest(BaseModel):
    template_key: Optional[str] = None
    key: Optional[str] = None
    title: Optional[str] = None
    row: Optional[dict[str, Any]] = None


class AdminUsersListResponse(BaseModel):
    users: List[AdminUserRow]
    total: int
    limit: int


class AdminProfilesListResponse(BaseModel):
    profiles: List[AdminProfileRow]
    total: int
    limit: int


class AdminEventChoiceBody(BaseModel):
    title: str
    description: str = ""
    effects: dict[str, Any] = {}


class AdminEventChoicePatchBody(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    effects: Optional[dict[str, Any]] = None


class AdminEventChoicesResponse(BaseModel):
    choices: List[dict[str, Any]]


class AdminCatalogRowMutationResponse(BaseModel):
    catalog_key: str
    id: int
    template_key: Optional[str] = None
    key: Optional[str] = None


class AdminCatalogRowDetailResponse(BaseModel):
    row: dict[str, Any]


class AdminCatalogPatchResponse(BaseModel):
    ok: bool
    row: Optional[dict[str, Any]] = None
    errors: dict[str, list[str]] = {}


class AdminProfileInspectorUser(BaseModel):
    id: int
    username: str
    telegram_id: Optional[int] = None
    guidance_completed_at: Optional[datetime] = None


class AdminProfileInspectorProfile(BaseModel):
    id: int
    user_id: int
    username: str
    name: str
    save_kind: str
    starter_template_key: Optional[str] = None
    is_active: bool
    is_archived: bool = False
    period_index: int
    time_state: str
    cash_balance: float
    safety_fund_balance: float
    negative_periods_count: int
    clean_period_streak: int
    onboarding_state: str = ""
    onboarding_step: str = ""
    period_duration_seconds: int = 0
    guidance_completed: bool = False
    guidance_current_beat: Optional[str] = None
    guidance_completed_beats: List[str] = []
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class AdminProfileInspectorEconomy(BaseModel):
    win_reached: bool = False


class AdminPeriodClosingRow(BaseModel):
    period_index: int
    cash_balance: float
    safety_fund_balance: float
    total_overdue_amount: float
    monthly_burn_total: float
    period_income_rate: float
    period_expense_total: float
    total_debt_balance: float
    closed_at: Optional[datetime] = None


class AdminActivityLogRow(BaseModel):
    id: int
    audience: str
    kind: str
    kind_label: str
    summary: str
    payload: dict[str, Any]
    telegram_sent: bool
    created_at: Optional[datetime] = None


class AdminProfileInspectorResponse(BaseModel):
    profile: AdminProfileInspectorProfile
    user: AdminProfileInspectorUser
    economy: AdminProfileInspectorEconomy
    period_closings: List[AdminPeriodClosingRow]
    activity_log: List[AdminActivityLogRow]
    latest_run_feedback: Optional[AdminLatestRunFeedback] = None
    pending_events: List[AdminPendingEventRow] = []


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


@router.post("/catalogs/{catalog_key}/rows", response_model=AdminCatalogRowMutationResponse)
async def admin_catalog_create_row(
    catalog_key: str,
    body: AdminCatalogCreateRequest,
    _admin: User = Depends(require_admin_user),
    db: Session = Depends(get_db),
):
    if get_catalog_spec(catalog_key) is None:
        raise HTTPException(status_code=404, detail="Unknown catalog")
    try:
        if body.row:
            result = create_catalog_row_payload(db, catalog_key, body.row)
        else:
            result = create_catalog_row(
                db,
                catalog_key,
                template_key=body.template_key,
                key=body.key or body.template_key,
                title=body.title,
            )
        db.commit()
    except KeyError:
        raise HTTPException(status_code=404, detail="Unknown catalog") from None
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return AdminCatalogRowMutationResponse(
        catalog_key=catalog_key,
        id=int(result["id"]),
        template_key=result.get("template_key"),
        key=result.get("key"),
    )


@router.post(
    "/catalogs/{catalog_key}/rows/{row_id}/clone",
    response_model=AdminCatalogRowMutationResponse,
)
async def admin_catalog_clone_row(
    catalog_key: str,
    row_id: int,
    _admin: User = Depends(require_admin_user),
    db: Session = Depends(get_db),
):
    if get_catalog_spec(catalog_key) is None:
        raise HTTPException(status_code=404, detail="Unknown catalog")
    try:
        result = clone_catalog_row(db, catalog_key, row_id)
        db.commit()
    except LookupError:
        raise HTTPException(status_code=404, detail="Row not found") from None
    except KeyError:
        raise HTTPException(status_code=404, detail="Unknown catalog") from None
    return AdminCatalogRowMutationResponse(
        catalog_key=catalog_key,
        id=int(result["id"]),
        template_key=result.get("template_key"),
        key=result.get("key"),
    )


@router.get("/catalogs/{catalog_key}/rows/{row_id}", response_model=AdminCatalogRowDetailResponse)
async def admin_catalog_row_detail(
    catalog_key: str,
    row_id: int,
    _admin: User = Depends(require_admin_user),
    db: Session = Depends(get_db),
):
    if get_catalog_spec(catalog_key) is None:
        raise HTTPException(status_code=404, detail="Unknown catalog")
    try:
        detail = get_catalog_row_detail(db, catalog_key, row_id)
    except KeyError:
        raise HTTPException(status_code=404, detail="Unknown catalog") from None
    if detail is None:
        raise HTTPException(status_code=404, detail="Row not found")
    return AdminCatalogRowDetailResponse(row=detail)


@router.patch("/catalogs/{catalog_key}/rows/{row_id}", response_model=AdminCatalogPatchResponse)
async def admin_catalog_patch_row(
    catalog_key: str,
    row_id: int,
    body: dict[str, Any],
    _admin: User = Depends(require_admin_user),
    db: Session = Depends(get_db),
):
    if get_catalog_spec(catalog_key) is None:
        raise HTTPException(status_code=404, detail="Unknown catalog")
    try:
        detail, errors = patch_catalog_row(db, catalog_key, row_id, body)
    except LookupError:
        raise HTTPException(status_code=404, detail="Row not found") from None
    except KeyError:
        raise HTTPException(status_code=404, detail="Unknown catalog") from None
    if errors:
        raise HTTPException(
            status_code=422,
            detail={"message": "Validation failed", "errors": errors},
        )
    db.commit()
    return AdminCatalogPatchResponse(ok=True, row=detail, errors={})


@router.get("/users", response_model=AdminUsersListResponse)
async def admin_list_users(
    q: str = Query("", max_length=120),
    limit: int = Query(100, ge=1, le=500),
    _admin: User = Depends(require_admin_user),
    db: Session = Depends(get_db),
):
    query = db.query(User).order_by(User.id.desc())
    needle = (q or "").strip()
    if needle:
        like = f"%{needle}%"
        query = query.filter(User.username.ilike(like))
    total = query.count()
    users = query.limit(limit).all()
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
    return AdminUsersListResponse(
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
        total=int(total),
        limit=limit,
    )


@router.get("/profiles", response_model=AdminProfilesListResponse)
async def admin_list_profiles(
    user_id: Optional[int] = Query(None, ge=1),
    q: str = Query("", max_length=120),
    profile_filter: str = Query("", max_length=32),
    stuck_only: bool = Query(False),
    limit: int = Query(100, ge=1, le=500),
    _admin: User = Depends(require_admin_user),
    db: Session = Depends(get_db),
):
    rows = fetch_profile_rows(
        db,
        limit=limit,
        q=q,
        profile_filter=profile_filter,
        stuck_only=stuck_only,
        user_id=user_id,
    )
    if user_id is not None:
        total = (
            db.query(func.count(GameProfile.id))
            .filter(GameProfile.user_id == int(user_id))
            .scalar()
            or 0
        )
    else:
        total = db.query(func.count(GameProfile.id)).scalar() or 0
    return AdminProfilesListResponse(
        profiles=[
            AdminProfileRow(**build_admin_profile_row(p, user)) for p, user in rows
        ],
        total=int(total),
        limit=limit,
    )


@router.get(
    "/catalogs/events/rows/{row_id}/choices",
    response_model=AdminEventChoicesResponse,
)
async def admin_event_choices_list(
    row_id: int,
    _admin: User = Depends(require_admin_user),
    db: Session = Depends(get_db),
):
    if db.query(EventDefinition).filter(EventDefinition.id == row_id).first() is None:
        raise HTTPException(status_code=404, detail="Event not found")
    return AdminEventChoicesResponse(choices=list_event_choices(db, row_id))


@router.post(
    "/catalogs/events/rows/{row_id}/choices",
    response_model=AdminEventChoicesResponse,
)
async def admin_event_choice_create(
    row_id: int,
    body: AdminEventChoiceBody,
    _admin: User = Depends(require_admin_user),
    db: Session = Depends(get_db),
):
    if db.query(EventDefinition).filter(EventDefinition.id == row_id).first() is None:
        raise HTTPException(status_code=404, detail="Event not found")
    try:
        create_event_choice(
            db,
            row_id,
            title=body.title,
            description=body.description,
            effects=body.effects,
        )
        db.commit()
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return AdminEventChoicesResponse(choices=list_event_choices(db, row_id))


@router.patch(
    "/catalogs/events/rows/{row_id}/choices/{choice_id}",
    response_model=AdminEventChoicesResponse,
)
async def admin_event_choice_patch(
    row_id: int,
    choice_id: int,
    body: AdminEventChoicePatchBody,
    _admin: User = Depends(require_admin_user),
    db: Session = Depends(get_db),
):
    if db.query(EventDefinition).filter(EventDefinition.id == row_id).first() is None:
        raise HTTPException(status_code=404, detail="Event not found")
    try:
        updated = patch_event_choice(
            db,
            choice_id,
            title=body.title,
            description=body.description,
            effects=body.effects,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    if updated is None:
        raise HTTPException(status_code=404, detail="Choice not found")
    db.commit()
    return AdminEventChoicesResponse(choices=list_event_choices(db, row_id))


@router.delete("/catalogs/events/rows/{row_id}/choices/{choice_id}")
async def admin_event_choice_delete(
    row_id: int,
    choice_id: int,
    _admin: User = Depends(require_admin_user),
    db: Session = Depends(get_db),
):
    if db.query(EventDefinition).filter(EventDefinition.id == row_id).first() is None:
        raise HTTPException(status_code=404, detail="Event not found")
    if not delete_event_choice(db, choice_id):
        raise HTTPException(status_code=404, detail="Choice not found")
    db.commit()
    return {"ok": True}


@router.get("/profiles/{profile_id}", response_model=AdminProfileInspectorResponse)
async def admin_profile_inspector(
    profile_id: int,
    log_limit: int = Query(50, ge=1, le=200),
    closing_limit: int = Query(12, ge=1, le=60),
    _admin: User = Depends(require_admin_user),
    db: Session = Depends(get_db),
):
    detail = build_profile_inspector(
        db,
        profile_id,
        log_limit=log_limit,
        closing_limit=closing_limit,
    )
    if detail is None:
        raise HTTPException(status_code=404, detail="Profile not found")
    return AdminProfileInspectorResponse(**detail)


@router.get("/metrics/summary", response_model=AdminMetricsSummary)
async def admin_metrics_summary(
    days: int = Query(7, ge=1, le=90),
    _admin: User = Depends(require_admin_user),
    db: Session = Depends(get_db),
):
    return AdminMetricsSummary(**build_metrics_summary(db, days=days))


@router.get("/export/profiles.csv")
async def admin_export_profiles_csv(
    limit: int = Query(500, ge=1, le=2000),
    q: str = Query("", max_length=120),
    profile_filter: str = Query("", max_length=32),
    stuck_only: bool = Query(False),
    _admin: User = Depends(require_admin_user),
    db: Session = Depends(get_db),
):
    rows = profiles_csv_rows(
        db,
        limit=limit,
        q=q,
        profile_filter=profile_filter,
        stuck_only=stuck_only,
    )
    return StreamingResponse(
        stream_csv(rows),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": 'attachment; filename="profiles.csv"'},
    )


@router.get("/export/run-feedback.csv")
async def admin_export_run_feedback_csv(
    limit: int = Query(500, ge=1, le=2000),
    _admin: User = Depends(require_admin_user),
    db: Session = Depends(get_db),
):
    rows = run_feedback_csv_rows(db, limit=limit)
    return StreamingResponse(
        stream_csv(rows),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": 'attachment; filename="run-feedback.csv"'},
    )


@router.get("/watchtower", response_model=AdminWatchtowerResponse)
async def admin_watchtower(
    user_limit: int = Query(50, ge=1, le=200),
    profile_limit: int = Query(50, ge=1, le=200),
    notification_limit: int = Query(100, ge=1, le=500),
    run_feedback_limit: int = Query(50, ge=1, le=200),
    q: str = Query("", max_length=120),
    profile_filter: str = Query("", max_length=32),
    stuck_only: bool = Query(False),
    _admin: User = Depends(require_admin_user),
    db: Session = Depends(get_db),
):
    users = db.query(User).order_by(User.id.desc()).limit(user_limit).all()
    profiles = fetch_profile_rows(
        db,
        limit=profile_limit,
        q=q,
        profile_filter=profile_filter,
        stuck_only=stuck_only,
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

    try:
        scan_stuck_and_emit(db, profiles)
    except Exception:
        import logging

        logging.getLogger(__name__).warning(
            "stuck_scan failed during watchtower", exc_info=True
        )

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
            AdminProfileRow(**build_admin_profile_row(p, user))
            for p, user in profiles
        ],
        onboarding_funnel=AdminOnboardingFunnel(**build_onboarding_funnel(db)),
        metrics_summary=AdminMetricsSummary(**build_metrics_summary(db, days=7)),
        notifications=[
            AdminNotificationRow(
                id=n.id,
                kind=n.kind,
                kind_label=kind_label_ru(n.kind),
                summary=format_alert_message_ru(n.kind, _parse_payload(n.payload_json)),
                user_id=n.user_id,
                game_profile_id=n.game_profile_id,
                payload=_parse_payload(n.payload_json),
                telegram_sent=bool(n.telegram_sent),
                created_at=n.created_at,
            )
            for n in notifications
        ],
        run_feedback=[AdminRunFeedbackRow(**row) for row in build_run_feedback_rows(db, limit=run_feedback_limit)],
    )


def _parse_payload(raw: str) -> dict[str, Any]:
    try:
        data = json.loads(raw or "{}")
        return data if isinstance(data, dict) else {}
    except json.JSONDecodeError:
        return {}
