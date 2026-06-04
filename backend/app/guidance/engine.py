"""O3 Progressive Guidance — spine curriculum + contextual triggers."""
from __future__ import annotations

import json
import logging
from typing import Any

from sqlalchemy.orm import Session

from ..game.time import get_active_game_profile
from ..models import User as UserModel
from ..models import EventInstance, GameProfile, PeriodSnapshot, User
from ..services.period.snapshot import get_current_period_snapshot
from .curriculum import BEAT_BY_ID, CURRICULUM, GuidanceBeat, SPINE_BEAT_IDS, beats_for_period
from .triggers import O2_BEAT_TO_TRIGGER, TRIGGER_IDS, TRIGGERS, TRIGGERS_BY_ID, GuidanceTrigger

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
    completed_beats = [str(x) for x in completed if str(x) in SPINE_BEAT_IDS]

    completed_triggers_raw = data.get("completed_triggers")
    if not isinstance(completed_triggers_raw, list):
        completed_triggers_raw = []
    completed_triggers = [str(x) for x in completed_triggers_raw if str(x) in TRIGGER_IDS]

    for old_beat, trigger_id in O2_BEAT_TO_TRIGGER.items():
        if old_beat in completed and trigger_id not in completed_triggers:
            completed_triggers.append(trigger_id)

    return {
        "completed_beats": completed_beats,
        "completed_triggers": completed_triggers,
        "view_beat_id": data.get("view_beat_id"),
        "dismiss_skip_count": int(data.get("dismiss_skip_count") or 0),
        "p1_close_debrief": bool(data.get("p1_close_debrief")),
        "events_chosen_p2": int(data.get("events_chosen_p2") or 0),
        "last_screen_enter": data.get("last_screen_enter"),
    }


def _save_progress(user: User, progress: dict[str, Any], db: Session) -> None:
    user.guidance_progress_json = json.dumps(
        {
            "completed_beats": progress.get("completed_beats") or [],
            "completed_triggers": progress.get("completed_triggers") or [],
            "view_beat_id": progress.get("view_beat_id"),
            "dismiss_skip_count": int(progress.get("dismiss_skip_count") or 0),
            "p1_close_debrief": bool(progress.get("p1_close_debrief")),
            "events_chosen_p2": int(progress.get("events_chosen_p2") or 0),
            "last_screen_enter": progress.get("last_screen_enter"),
        },
        ensure_ascii=False,
    )
    db.add(user)


def _is_beat_completed(progress: dict[str, Any], beat_id: str) -> bool:
    return beat_id in (progress.get("completed_beats") or [])


def _is_trigger_completed(progress: dict[str, Any], trigger_id: str) -> bool:
    return trigger_id in (progress.get("completed_triggers") or [])


def _mark_beat_completed(progress: dict[str, Any], beat_id: str) -> None:
    if beat_id not in BEAT_BY_ID:
        return
    completed: list[str] = list(progress.get("completed_beats") or [])
    if beat_id not in completed:
        completed.append(beat_id)
    progress["completed_beats"] = completed


def _mark_trigger_completed(progress: dict[str, Any], trigger_id: str) -> None:
    if trigger_id not in TRIGGER_IDS:
        return
    completed: list[str] = list(progress.get("completed_triggers") or [])
    if trigger_id not in completed:
        completed.append(trigger_id)
    progress["completed_triggers"] = completed


def _spine_complete(progress: dict[str, Any]) -> bool:
    return _is_beat_completed(progress, "p1_close") and _is_beat_completed(progress, "p2_new_month")


def _pending_events_count(db: Session, profile: GameProfile) -> int:
    return (
        db.query(EventInstance)
        .filter(
            EventInstance.game_profile_id == profile.id,
            EventInstance.status == "pending",
        )
        .count()
    )


def _non_farewell_triggers_done(progress: dict[str, Any]) -> bool:
    for trigger in TRIGGERS:
        if trigger.id == "t_farewell":
            continue
        if not _is_trigger_completed(progress, trigger.id):
            return False
    return True


def _trigger_eligible(
    db: Session,
    profile: GameProfile,
    progress: dict[str, Any],
    trigger: GuidanceTrigger,
    *,
    screen_enter_id: str | None = None,
) -> bool:
    if _is_trigger_completed(progress, trigger.id):
        return False
    if not _spine_complete(progress):
        return False

    if trigger.id == "t_farewell":
        return _non_farewell_triggers_done(progress)

    if trigger.screen:
        mapped = screen_enter_id if screen_enter_id in TRIGGER_IDS else None
        if mapped != trigger.id:
            return False
        return True

    if trigger.id == "t_events_intro":
        if int(profile.period_index or 1) < 2:
            return False
        if int(progress.get("events_chosen_p2") or 0) >= 1:
            return True
        return _pending_events_count(db, profile) > 0

    return False


def _pick_active_trigger(
    db: Session,
    profile: GameProfile,
    progress: dict[str, Any],
) -> GuidanceTrigger | None:
    screen_enter = progress.get("last_screen_enter")
    if screen_enter in TRIGGER_IDS:
        candidate = TRIGGERS_BY_ID[screen_enter]
        if _trigger_eligible(db, profile, progress, candidate, screen_enter_id=screen_enter):
            return candidate

    for trigger in TRIGGERS:
        if trigger.screen:
            continue
        if _trigger_eligible(db, profile, progress, trigger):
            return trigger
    return None


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


def _trigger_gate_satisfied(
    db: Session,
    profile: GameProfile,
    progress: dict[str, Any],
    trigger: GuidanceTrigger,
) -> bool:
    if trigger.gate == "action_event":
        if int(progress.get("events_chosen_p2") or 0) >= 1:
            return True
        count = (
            db.query(EventInstance)
            .filter(
                EventInstance.game_profile_id == profile.id,
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
        if _is_beat_completed(progress, beat.id):
            continue
        if beat.id == "p1_close":
            continue
        if _gate_satisfied(db, profile, snapshot, beat, progress):
            _mark_beat_completed(progress, beat.id)
            changed = True
    for trigger in TRIGGERS:
        if _is_trigger_completed(progress, trigger.id):
            continue
        if _trigger_gate_satisfied(db, profile, progress, trigger):
            _mark_trigger_completed(progress, trigger.id)
            changed = True
    return changed


def _first_incomplete_spine_beat(profile: GameProfile, progress: dict[str, Any]) -> GuidanceBeat | None:
    pi = max(1, min(2, int(profile.period_index or 1)))
    for period in range(1, pi + 1):
        for beat in beats_for_period(period):
            if not _is_beat_completed(progress, beat.id):
                return beat
    if pi >= 2:
        for beat in beats_for_period(2):
            if not _is_beat_completed(progress, beat.id):
                return beat
    return None


def _module_indices(beat: GuidanceBeat, progress: dict[str, Any]) -> tuple[int, int, int]:
    module = beats_for_period(beat.period_index)
    count = beat.module_step_count
    completed_ids = set(progress.get("completed_beats") or [])
    last_done = -1
    for i, b in enumerate(module):
        if b.id in completed_ids:
            last_done = i
    view_id = progress.get("view_beat_id")
    view_index = 0
    if view_id and view_id in BEAT_BY_ID:
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


def _trigger_indices(trigger: GuidanceTrigger, progress: dict[str, Any]) -> tuple[int, int, int]:
    order_list = [t.id for t in TRIGGERS]
    completed = set(progress.get("completed_triggers") or [])
    last_done = -1
    for i, tid in enumerate(order_list):
        if tid in completed:
            last_done = i
    idx = order_list.index(trigger.id)
    return idx, last_done, len(order_list)


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


def _guidance_payload_from_beat(
    display_beat: GuidanceBeat,
    progress: dict[str, Any],
    db: Session,
    profile: GameProfile,
    snapshot: PeriodSnapshot | None,
) -> dict[str, Any]:
    view_index, last_completed, step_count = _module_indices(display_beat, progress)
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
        "is_trigger": False,
    }


def _guidance_payload_from_trigger(
    trigger: GuidanceTrigger,
    progress: dict[str, Any],
    db: Session,
    profile: GameProfile,
) -> dict[str, Any]:
    view_index, last_completed, step_count = _trigger_indices(trigger, progress)
    beat_completed = _trigger_gate_satisfied(db, profile, progress, trigger)
    return {
        "show_curriculum": True,
        "beat_id": trigger.id,
        "title": trigger.title,
        "body": trigger.body,
        "module_step": trigger.order,
        "module_step_count": step_count,
        "view_index": view_index,
        "last_completed_index": last_completed,
        "completed_beats": list(progress.get("completed_triggers") or []),
        "beat_completed": beat_completed,
        "dismiss_skip_count": int(progress.get("dismiss_skip_count") or 0),
        "show_debrief": False,
        "nudge_id": None,
        "nudge_title": None,
        "nudge_body": None,
        "is_trigger": True,
    }


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
        "is_trigger": False,
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

    if _spine_complete(progress):
        active_trigger = _pick_active_trigger(db, profile, progress)
        if active_trigger:
            return _guidance_payload_from_trigger(active_trigger, progress, db, profile)
        if _non_farewell_triggers_done(progress) and not _is_trigger_completed(progress, "t_farewell"):
            return _guidance_payload_from_trigger(TRIGGERS_BY_ID["t_farewell"], progress, db, profile)
        if _is_trigger_completed(progress, "t_farewell"):
            complete_guidance(user, profile, db)
        return empty

    active = _first_incomplete_spine_beat(profile, progress)
    if not active:
        complete_guidance(user, profile, db)
        return empty

    view_beat = active
    view_id = progress.get("view_beat_id")
    if view_id and view_id in BEAT_BY_ID:
        candidate = BEAT_BY_ID[view_id]
        if candidate.period_index == active.period_index:
            view_beat = candidate

    module = beats_for_period(view_beat.period_index)
    view_index, _, _ = _module_indices(view_beat, progress)
    display_beat = module[view_index] if module else view_beat

    return _guidance_payload_from_beat(display_beat, progress, db, profile, snapshot)


def patch_guidance(
    db: Session,
    user_id: int,
    *,
    action: str,
    beat_id: str | None = None,
    view_index: int | None = None,
    trigger_id: str | None = None,
) -> dict[str, Any]:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise ValueError("user not found")
    profile = get_active_game_profile(db, user_id)
    if int(getattr(user, "guidance_completed", 0) or 0) == 1:
        return build_guidance_overview(db, user, profile)

    progress = _load_progress(user)
    snapshot = get_current_period_snapshot(db, profile)
    active_spine = _first_incomplete_spine_beat(profile, progress)

    if action == "skip_all":
        complete_guidance(user, profile, db)
        return build_guidance_overview(db, user, profile)

    if action == "screen_enter" and trigger_id and trigger_id in TRIGGER_IDS:
        progress["last_screen_enter"] = trigger_id
        progress["dismiss_skip_count"] = 0
        _save_progress(user, progress, db)
        db.commit()
        return build_guidance_overview(db, user, profile)

    if action == "dismiss_beat":
        if active_spine and not _spine_complete(progress):
            _mark_beat_completed(progress, active_spine.id)
        else:
            active_trigger = _pick_active_trigger(db, profile, progress)
            if active_trigger:
                _mark_trigger_completed(progress, active_trigger.id)
                progress["last_screen_enter"] = None
        progress["dismiss_skip_count"] = int(progress.get("dismiss_skip_count") or 0) + 1
        progress["view_beat_id"] = None
        _save_progress(user, progress, db)
        db.commit()
        return build_guidance_overview(db, user, profile)

    if action == "advance_read" and beat_id:
        if beat_id in BEAT_BY_ID:
            beat = BEAT_BY_ID[beat_id]
            if beat.gate in ("read", "farewell"):
                _mark_beat_completed(progress, beat_id)
            if beat_id == "p1_close" and progress.get("p1_close_debrief"):
                _mark_beat_completed(progress, beat_id)
                progress["p1_close_debrief"] = False
            progress["dismiss_skip_count"] = 0
            progress["view_beat_id"] = None
        elif beat_id in TRIGGER_IDS:
            trigger = TRIGGERS_BY_ID[beat_id]
            if trigger.gate in ("read", "farewell"):
                _mark_trigger_completed(progress, beat_id)
            progress["last_screen_enter"] = None
            progress["dismiss_skip_count"] = 0
            if beat_id == "t_farewell":
                _save_progress(user, progress, db)
                complete_guidance(user, profile, db)
                return build_guidance_overview(db, user, profile)
        _save_progress(user, progress, db)
        db.commit()
        return build_guidance_overview(db, user, profile)

    if action == "nav" and view_index is not None and active_spine:
        module = beats_for_period(active_spine.period_index)
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
        _mark_trigger_completed(progress, "t_events_intro")
        _sync_auto_gates(db, profile, snapshot, progress)
        _save_progress(user, progress, db)
        db.commit()

    if action == "p1_close_debrief":
        progress["p1_close_debrief"] = True
        _save_progress(user, progress, db)
        db.commit()

    if action == "complete_beat" and beat_id and beat_id in BEAT_BY_ID:
        _mark_beat_completed(progress, beat_id)
        progress["view_beat_id"] = None
        _save_progress(user, progress, db)
        db.commit()

    _sync_auto_gates(db, profile, snapshot, progress)
    _save_progress(user, progress, db)
    db.commit()
    db.refresh(user)
    return build_guidance_overview(db, user, profile)


def period1_guidance_complete(progress: dict[str, Any]) -> bool:
    for bid in ("p1_period", "p1_flows", "p1_salary", "p1_cushion", "p1_close"):
        if bid not in (progress.get("completed_beats") or []):
            return False
    return True


def on_period_closed_guidance(db: Session, user_id: int, profile: GameProfile, closed_period_index: int) -> None:
    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if not user or int(getattr(user, "guidance_completed", 0) or 0) == 1:
        return
    progress = _load_progress(user)
    if closed_period_index == 1 and not _is_beat_completed(progress, "p1_close"):
        progress["p1_close_debrief"] = True
        progress["view_beat_id"] = "p1_close"
        _save_progress(user, progress, db)


def on_event_chosen(db: Session, user_id: int) -> None:
    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if not user or int(getattr(user, "guidance_completed", 0) or 0) == 1:
        return
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


# Back-compat for tests importing _first_incomplete_beat
def _first_incomplete_beat(profile: GameProfile, progress: dict[str, Any]) -> GuidanceBeat | None:
    return _first_incomplete_spine_beat(profile, progress)
