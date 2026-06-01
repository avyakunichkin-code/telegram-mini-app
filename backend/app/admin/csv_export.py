"""CSV export для Admin Watchtower (AQ-07)."""

from __future__ import annotations

import csv
import io
from typing import Any, Iterable

from sqlalchemy.orm import Session

from .run_feedback import build_run_feedback_rows
from .watchtower_profiles import build_admin_profile_row, fetch_profile_rows


def _csv_stream(rows: Iterable[list[Any]]) -> Iterable[str]:
    buf = io.StringIO()
    writer = csv.writer(buf)
    for row in rows:
        writer.writerow(row)
        yield buf.getvalue()
        buf.seek(0)
        buf.truncate(0)


def profiles_csv_rows(
    db: Session,
    *,
    limit: int = 500,
    q: str = "",
    profile_filter: str = "",
    stuck_only: bool = False,
) -> Iterable[list[Any]]:
    header = [
        "id",
        "user_id",
        "username",
        "name",
        "save_kind",
        "starter_template_key",
        "is_active",
        "is_archived",
        "run_outcome",
        "period_index",
        "cash_balance",
        "onboarding_state",
        "guidance_completed",
        "stuck_kind",
        "created_at",
        "updated_at",
    ]
    yield header
    pairs = fetch_profile_rows(
        db,
        limit=limit,
        q=q,
        profile_filter=profile_filter,
        stuck_only=stuck_only,
    )
    for profile, user in pairs:
        row = build_admin_profile_row(profile, user)
        yield [
            row["id"],
            row["user_id"],
            row["username"],
            row["name"],
            row["save_kind"],
            row["starter_template_key"] or "",
            1 if row["is_active"] else 0,
            1 if row["is_archived"] else 0,
            row["run_outcome"] or "",
            row["period_index"],
            row["cash_balance"],
            row["onboarding_state"],
            1 if row["guidance_completed"] else 0,
            row["stuck_kind"] or "",
            row["created_at"].isoformat() if row["created_at"] else "",
            row["updated_at"].isoformat() if row["updated_at"] else "",
        ]


def run_feedback_csv_rows(db: Session, *, limit: int = 500) -> Iterable[list[Any]]:
    header = [
        "id",
        "user_id",
        "username",
        "game_profile_id",
        "profile_name",
        "outcome",
        "template_key",
        "period_index",
        "defeat_reason",
        "comment",
        "created_at",
    ]
    yield header
    for row in build_run_feedback_rows(db, limit=limit):
        yield [
            row["id"],
            row["user_id"],
            row["username"],
            row["game_profile_id"],
            row["profile_name"],
            row["outcome"],
            row["template_key"] or "",
            row["period_index"],
            row["defeat_reason"] or "",
            row["comment"],
            row["created_at"].isoformat() if row["created_at"] else "",
        ]


def stream_csv(rows: Iterable[list[Any]]) -> Iterable[str]:
    yield from _csv_stream(rows)
