"""O2 Progressive Guidance — progress, gates, overview."""
from __future__ import annotations

import json
import logging
from typing import Any

from sqlalchemy.orm import Session

from ..game.time import get_active_game_profile
from ..models import User as UserModel
from ..models import EventInstance, GameProfile, PeriodSnapshot, User
from ..services.period.snapshot import get_current_period_snapshot
from .curriculum import BEAT_BY_ID, CURRICULUM, GuidanceBeat, beats_for_period

logger = logging.getLogger(__name__)

STUDENT_TEMPLATE_KEY = "mq_game_basic_v1"


def _load_progress(user: User) -> dict[str, Any]:
    raw = getattr(user, "guidance_progress_json", None) or "{}"
    try:
        data = json.loads(raw) if isinstance(raw, str) else dict(raw or {})
    except json.JSONDecodeError:
        data = {}
    if not isinstance(data, dict):
        data = {}
    completed = data.get("completed_beats")
    if not isinstance(completed, list):
        completed = []
    return {
        "completed_beats": [str(x) for x in completed if str(x) in BEAT_BY_ID],
        "view_beat_id": data.get("view_beat_id"),
        "dismiss_skip_count": int(data.get("dismiss_skip_count") or 0),
        "p1_close_debrief": bool(data.get("p1_close_debrief")),
        "events_chosen_p2": int(data.get("events_chosen_p2") or 0),
    }


def _save_progress(user: User, progress: dict[str, Any], db: Session) -> None:
    user.guidance_progress_json = json.dumps(
        {
            "completed_beats": progress.get("completed_beats") or [],
            "view_beat_id": progress.get("view_beat_id"),
            "dismiss_skip_count": int(progress.get("dismiss_skip_count") or 0),
            "p1_close_debrief": bool(progress.get("p1_close_debrief")),
            "events_chosen_p2": int(progress.get("events_chosen_p2") or 0),
        },
        ensure_ascii=False,
    )
    db.add(user)


def _is_completed(progress: dict[str, Any], beat_id: str) -> bool:
    return beat_id in (progress.get("completed_beats") or [])


def _mark_completed(progress: dict[str, Any], beat_id: str) -> None:
    if beat_id not in BEAT_BY_ID:
        return
    completed: list[str] = list(progress.get("completed_beats") or [])
    if beat_id not in completed:
        completed.append(beat_id)
    progress["completed_beats"] = completed


def _gate_satisfied(
    db: Session,
    profile: GameProfile,
    snapshot: PeriodSnapshot | None,
    beat: GuidanceBeat,
    progress: dict[str, Any],
) -> bool:
    gate = beat.gate
    if gate == "read" or gate == "farewell":
        return False
    if gate == "action_salary":
        if snapshot and int(snapshot.salary_claimed or 0) == 1:
            return True
        return int(getattr(profile, "last_period_salary_claimed", 0) or 0) == int(profile.period_index or 0)
    if gate == "action_cushion":
        if snapshot and float(snapshot.safety_fund_contribution or 0) > 0:
            return True
        return False
    if gate == "action_close":
        return False
    if gate == "action_event":
        if int(progress.get("events_chosen_p2") or 0) >= 1:
            return True
        count = (
            db.query(EventInstance)
            .filter(
                EventInstance.game_profile_id == profile.id,
                EventInstance.period_index == 2,
                EventInstance.status == "selected",
            )
            .count()
        )
        return count >= 1
    return False


def _sync_auto_gates(
    db: Session,
    profile: GameProfile,
    snapshot: PeriodSnapshot | None,
    progress: dict[str, Any],
) -> bool:
    changed = False
    for beat in CURRICULUM:
        if _is_completed(progress, beat.id):
            continue
        if beat.id == "p1_close":
            continue
        if _gate_satisfied(db, profile, snapshot, beat, progress):
            _mark_completed(progress, beat.id)
            changed = True
    return changed


def _first_incomplete_beat(profile: GameProfile, progress: dict[str, Any]) -> GuidanceBeat | None:
    pi = max(1, min(3, int(profile.period_index or 1)))
    for beat in beats_for_period(pi):
        if not _is_completed(progress, beat.id):
            return beat
    if pi < 3:
        for beat in beats_for_period(pi + 1):
            if not _is_completed(progress, beat.id):
                return beat
    for beat in CURRICULUM:
        if not _is_completed(progress, beat.id):
            return beat
    return None


def _module_indices(beat: GuidanceBeat, progress: dict[str, Any]) -> tuple[int, int, int]:
    """view_index (0-based), last_completed_index (-1..), module_step_count."""
    module = beats_for_period(beat.period_index)
    count = beat.module_step_count
    completed_ids = set(progress.get("completed_beats") or [])
    last_done = -1
    for i, b in enumerate(module):
        if b.id in completed_ids:
            last_done = i
    view_id = progress.get("view_beat_id")
    view_index = 0
    if view_id:
        for i, b in enumerate(module):
            if b.id == view_id:
                view_index = i
                break
    else:
        for i, b in enumerate(module):
            if b.id == beat.id:
                view_index = i
                break
    view_index = max(0, min(view_index, len(module) - 1))
    if view_index > last_done + 1:
        view_index = last_done + 1
    return view_index, last_done, count


def _beat_body(beat: GuidanceBeat, progress: dict[str, Any], db: Session, profile: GameProfile) -> str:
    if beat.id == "p1_close" and progress.get("p1_close_debrief") and beat.debrief_body:
        return beat.debrief_body
    body = beat.body
    if beat.id == "p1_close" and not progress.get("p1_close_debrief"):
        try:
            from ..finance.period_close_preview import estimate_period_close_preview

            preview = estimate_period_close_preview(db, profile)
            charges = float(preview.get("estimated_charges_total") or 0)
            if charges > 0:
                rounded = int(round(charges))
                body += f"\n\nПредпросмотр: при закрытии спишется около **{rounded:,} ₽**.".replace(",", " ")
        except Exception:
            logger.debug("p1_close preview append failed", exc_info=True)
    return body


def complete_guidance(user: User, profile: GameProfile, db: Session) -> None:
    user.guidance_completed = 1
    from ..timeutil import utc_now_naive

    user.guidance_completed_at = utc_now_naive()
    profile.onboarding_state = "brief_done"
    profile.onboarding_step = "farewell"
    _save_progress(user, _load_progress(user), db)
    db.add(user)
    db.add(profile)
    db.commit()
    try:
        from ..admin.notify import notify_onboarding_brief_done

        notify_onboarding_brief_done(db, profile)
    except Exception:
        logger.warning("notify_onboarding_brief_done failed", exc_info=True)


def build_guidance_overview(db: Session, user: User | None, profile: GameProfile) -> dict[str, Any]:
    empty = {
        "show_curriculum": False,
        "beat_id": None,
        "title": None,
        "body": None,
        "module_step": 0,
        "module_step_count": 0,
        "view_index": 0,
        "last_completed_index": -1,
        "completed_beats": [],
        "beat_completed": False,
        "dismiss_skip_count": 0,
        "show_debrief": False,
        "nudge_id": None,
        "nudge_title": None,
        "nudge_body": None,
    }
    if not user:
        return empty
    if int(getattr(user, "guidance_completed", 0) or 0) == 1:
        nudge = _build_nudge_block(db, user, profile)
        if not nudge:
            return empty
        return {
            **empty,
            "show_curriculum": False,
            "nudge_id": nudge["nudge_id"],
            "nudge_title": nudge["nudge_title"],
            "nudge_body": nudge["nudge_body"],
        }

    progress = _load_progress(user)
    snapshot = get_current_period_snapshot(db, profile)
    if _sync_auto_gates(db, profile, snapshot, progress):
        _save_progress(user, progress, db)
        db.commit()
        db.refresh(user)

    active = _first_incomplete_beat(profile, progress)
    if not active:
        complete_guidance(user, profile, db)
        return empty

    if active.gate == "farewell" and _is_completed(progress, "p3_needs"):
        _mark_completed(progress, active.id)
        _save_progress(user, progress, db)
        complete_guidance(user, profile, db)
        return empty

    view_beat = active
    view_id = progress.get("view_beat_id")
    if view_id and view_id in BEAT_BY_ID:
        candidate = BEAT_BY_ID[view_id]
        if candidate.period_index == active.period_index:
            view_beat = candidate

    view_index, last_completed, step_count = _module_indices(view_beat, progress)
    module = beats_for_period(view_beat.period_index)
    display_beat = module[view_index] if module else view_beat

    show_debrief = bool(display_beat.id == "p1_close" and progress.get("p1_close_debrief"))

    if display_beat.id == "p1_close":
        beat_completed = int(profile.period_index or 1) >= 2 and bool(progress.get("p1_close_debrief"))
    elif display_beat.gate in ("read", "farewell"):
        beat_completed = False
    else:
        beat_completed = _gate_satisfied(db, profile, snapshot, display_beat, progress)

    return {
        "show_curriculum": True,
        "beat_id": display_beat.id,
        "title": display_beat.title,
        "body": _beat_body(display_beat, progress, db, profile),
        "module_step": display_beat.module_step,
        "module_step_count": step_count,
        "view_index": view_index,
        "last_completed_index": last_completed,
        "completed_beats": list(progress.get("completed_beats") or []),
        "beat_completed": beat_completed,
        "dismiss_skip_count": int(progress.get("dismiss_skip_count") or 0),
        "show_debrief": show_debrief,
        "nudge_id": None,
        "nudge_title": None,
        "nudge_body": None,
    }


def patch_guidance(
    db: Session,
    user_id: int,
    *,
    action: str,
    beat_id: str | None = None,
    view_index: int | None = None,
) -> dict[str, Any]:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise ValueError("user not found")
    profile = get_active_game_profile(db, user_id)
    if int(getattr(user, "guidance_completed", 0) or 0) == 1:
        return build_guidance_overview(db, user, profile)

    progress = _load_progress(user)
    snapshot = get_current_period_snapshot(db, profile)
    active = _first_incomplete_beat(profile, progress)

    if action == "skip_all":
        complete_guidance(user, profile, db)
        return build_guidance_overview(db, user, profile)

    if action == "dismiss_beat":
        if active:
            _mark_completed(progress, active.id)
        progress["dismiss_skip_count"] = int(progress.get("dismiss_skip_count") or 0) + 1
        progress["view_beat_id"] = None
        _save_progress(user, progress, db)
        db.commit()
        return build_guidance_overview(db, user, profile)

    if action == "advance_read" and beat_id and beat_id in BEAT_BY_ID:
        beat = BEAT_BY_ID[beat_id]
        if beat.gate in ("read", "farewell"):
            _mark_completed(progress, beat_id)
        if beat_id == "p1_close" and progress.get("p1_close_debrief"):
            _mark_completed(progress, beat_id)
            progress["p1_close_debrief"] = False
        if beat_id == "p3_farewell":
            _save_progress(user, progress, db)
            complete_guidance(user, profile, db)
            return build_guidance_overview(db, user, profile)
        progress["dismiss_skip_count"] = 0
        progress["view_beat_id"] = None
        _save_progress(user, progress, db)
        db.commit()
        return build_guidance_overview(db, user, profile)

    if action == "nav" and view_index is not None and active:
        module = beats_for_period(active.period_index)
        completed_ids = set(progress.get("completed_beats") or [])
        last_done = -1
        for i, b in enumerate(module):
            if b.id in completed_ids:
                last_done = i
        idx = max(0, min(int(view_index), len(module) - 1))
        if idx <= last_done + 1:
            progress["view_beat_id"] = module[idx].id
            _save_progress(user, progress, db)
            db.commit()

    if action == "event_chosen":
        progress["events_chosen_p2"] = int(progress.get("events_chosen_p2") or 0) + 1
        _sync_auto_gates(db, profile, snapshot, progress)
        _save_progress(user, progress, db)
        db.commit()

    if action == "p1_close_debrief":
        progress["p1_close_debrief"] = True
        _save_progress(user, progress, db)
        db.commit()

    if action == "complete_beat" and beat_id:
        _mark_completed(progress, beat_id)
        progress["view_beat_id"] = None
        _save_progress(user, progress, db)
        db.commit()

    _sync_auto_gates(db, profile, snapshot, progress)
    _save_progress(user, progress, db)
    db.commit()
    db.refresh(user)
    return build_guidance_overview(db, user, profile)


def period1_guidance_complete(progress: dict[str, Any]) -> bool:
    for bid in ("p1_period", "p1_salary", "p1_cushion", "p1_close"):
        if bid not in (progress.get("completed_beats") or []):
            return False
    return True


def on_period_closed_guidance(db: Session, user_id: int, profile: GameProfile, closed_period_index: int) -> None:
    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if not user or int(getattr(user, "guidance_completed", 0) or 0) == 1:
        return
    progress = _load_progress(user)
    if closed_period_index == 1 and not _is_completed(progress, "p1_close"):
        progress["p1_close_debrief"] = True
        progress["view_beat_id"] = "p1_close"
        _save_progress(user, progress, db)


def on_event_chosen(db: Session, user_id: int) -> None:
    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if not user or int(getattr(user, "guidance_completed", 0) or 0) == 1:
        return
    profile = get_active_game_profile(db, user_id)
    patch_guidance(db, user_id, action="event_chosen")


def update_nudge_streaks_on_period_close(
    profile: GameProfile,
    *,
    salary_claimed: bool,
    cash_end: float,
) -> None:
    if not salary_claimed:
        profile.salary_miss_streak = int(getattr(profile, "salary_miss_streak", 0) or 0) + 1
    else:
        profile.salary_miss_streak = 0
    if cash_end < 0:
        profile.negative_close_streak = int(getattr(profile, "negative_close_streak", 0) or 0) + 1
    else:
        profile.negative_close_streak = 0


def _nudge_threshold(profile: GameProfile, kind: str) -> int:
    tk = str(getattr(profile, "starter_template_key", "") or "")
    if tk == STUDENT_TEMPLATE_KEY:
        return 1
    return 2


def _build_nudge_block(db: Session, user: User, profile: GameProfile) -> dict[str, Any] | None:
    if int(getattr(user, "guidance_completed", 0) or 0) != 1:
        return None
    salary_streak = int(getattr(profile, "salary_miss_streak", 0) or 0)
    neg_streak = int(getattr(profile, "negative_close_streak", 0) or 0)
    if salary_streak >= _nudge_threshold(profile, "salary"):
        return {
            "nudge_id": "nudge_salary_miss",
            "nudge_title": "Зарплата",
            "nudge_body": "Ты закрыл месяц без зарплаты — за этот период выплата уже не повторится. Забирай до «Закрыть месяц».",
        }
    if neg_streak >= _nudge_threshold(profile, "negative"):
        return {
            "nudge_id": "nudge_negative_close",
            "nudge_title": "Минус на счёте",
            "nudge_body": "После списаний баланс ушёл в минус. Посмотри, что съело деньги в итогах месяца — так проще не повторить.",
        }
    return None
