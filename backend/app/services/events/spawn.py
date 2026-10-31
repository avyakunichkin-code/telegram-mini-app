"""Пул периода: intro-событие, спавн событий периода, expire при закрытии."""
import logging

from sqlalchemy import or_
from sqlalchemy.orm import Session

from ...events.chains import CHAIN_FOLLOWUP_EXCLUDE_FROM_RANDOM_POOL, ensure_scheduled_chain_events
from ...events.choice_snapshot import attach_event_instance_choice_snapshot
from ...events.constants import EVENTS_UNLOCK_INTRO_KEY, PERIOD_EVENT_POOL_EXCLUDE_KEYS
from ...events.taxonomy import audience_matches, event_slot
from ...game.rules import (
    EVENTS_PER_PERIOD,
    MIN_PERIOD_INDEX_FOR_GAME_EVENTS,
    event_tier_in_core_window,
    event_tier_in_fallback_primary,
    is_event_definition_eligible,
    spawn_priority_active,
)
from ...models import EventDefinition, EventInstance, GameProfile, User
from .needs_rescue import _needs_config_for_profile, _rescue_weight_multiplier
from .selection import (
    _def_tier,
    _definition_prerequisites_met,
    _load_event_counter_map,
    _load_event_profile_context,
    _pick_diverse_period_events,
)

def _definition_meta(d: EventDefinition) -> dict:
    import json

    try:
        meta = json.loads(getattr(d, "metadata_json", None) or "{}")
    except (TypeError, ValueError):
        return {}
    return meta if isinstance(meta, dict) else {}


def _priority_rank(d: EventDefinition) -> int:
    try:
        return int(_definition_meta(d).get("spawn_priority_rank") or 100)
    except (TypeError, ValueError):
        return 100


# Имя логгера исторически — модуль service; сохраняем для фильтров/алертов.
logger = logging.getLogger("app.services.events.service")

_PERIOD_EVENT_POOL_EXCLUDE_KEYS = PERIOD_EVENT_POOL_EXCLUDE_KEYS


def expire_pending_events_for_closed_period(db: Session, game_profile_id: int, closed_period_index: int) -> int:
    """Все pending-инстансы закрываемого периода → expired (SPEC MVP 1.1)."""
    updated = (
        db.query(EventInstance)
        .filter(
            EventInstance.game_profile_id == game_profile_id,
            EventInstance.period_index == closed_period_index,
            EventInstance.status == "pending",
        )
        .update({"status": "expired"}, synchronize_session=False)
    )
    return int(updated or 0)


def _o2_guidance_replaces_events_intro(db: Session, profile: GameProfile) -> bool:
    """O2 p2_events_intro заменяет mq11_events_unlock_intro (SPEC_onboarding-o2)."""
    user = db.query(User).filter(User.id == profile.user_id).first()
    return user is not None and int(getattr(user, "guidance_completed", 0) or 0) == 0


def ensure_events_unlock_intro(db: Session, profile: GameProfile) -> None:
    """Разовое intro-событие при первом доступе к колоде (legacy, без O2 guidance)."""
    if int(profile.period_index or 1) < MIN_PERIOD_INDEX_FOR_GAME_EVENTS:
        return
    if _o2_guidance_replaces_events_intro(db, profile):
        return

    definition = (
        db.query(EventDefinition)
        .filter(
            EventDefinition.key == EVENTS_UNLOCK_INTRO_KEY,
            EventDefinition.is_active == 1,
        )
        .first()
    )
    if not definition:
        return

    counter = _load_event_counter_map(db, profile.id).get(int(definition.id))
    if not is_event_definition_eligible(
        repeat_policy=getattr(definition, "repeat_policy", None),
        repeat_max=getattr(definition, "repeat_max", None),
        cooldown_periods=int(getattr(definition, "cooldown_periods", 0) or 0),
        current_period_index=int(profile.period_index),
        counter=counter,
    ):
        return

    already = (
        db.query(EventInstance)
        .filter(
            EventInstance.game_profile_id == profile.id,
            EventInstance.definition_id == definition.id,
        )
        .first()
    )
    if already:
        return

    inst = EventInstance(
        game_profile_id=profile.id,
        period_index=int(profile.period_index),
        definition_id=definition.id,
        status="pending",
    )
    db.add(inst)
    db.flush()
    attach_event_instance_choice_snapshot(db, profile, definition, inst)
    db.commit()


def _period_pool_instance_count(
    db: Session, game_profile_id: int, period_index: int, *, exclude_intro: bool = True
) -> int:
    q = db.query(EventInstance).filter(
        EventInstance.game_profile_id == game_profile_id,
        EventInstance.period_index == period_index,
    )
    exclude_def_ids: list[int] = []
    if exclude_intro:
        intro = (
            db.query(EventDefinition.id)
            .filter(EventDefinition.key == EVENTS_UNLOCK_INTRO_KEY)
            .scalar()
        )
        if intro is not None:
            exclude_def_ids.append(int(intro))
    for key in CHAIN_FOLLOWUP_EXCLUDE_FROM_RANDOM_POOL:
        row = db.query(EventDefinition.id).filter(EventDefinition.key == key).scalar()
        if row is not None:
            exclude_def_ids.append(int(row))
    if exclude_def_ids:
        q = q.filter(EventInstance.definition_id.notin_(exclude_def_ids))
    return int(q.count())


SPAWN_OK = "ok"
SPAWN_SKIPPED_INTRO = "skipped_intro"
SPAWN_ALREADY_FULL = "already_full"
SPAWN_EMPTY_POOL = "empty_pool"


def is_events_spawn_failed(status: str | None) -> bool:
    return status == SPAWN_EMPTY_POOL


def ensure_period_events(db: Session, game_profile_id: int, period_index: int, save_kind: str) -> str:
    profile = db.query(GameProfile).filter(GameProfile.id == game_profile_id).first()
    if not profile:
        return SPAWN_OK

    if int(period_index) < MIN_PERIOD_INDEX_FOR_GAME_EVENTS:
        return SPAWN_SKIPPED_INTRO

    ensure_scheduled_chain_events(db, game_profile_id, period_index)

    if _period_pool_instance_count(db, game_profile_id, period_index) >= EVENTS_PER_PERIOD:
        return SPAWN_ALREADY_FULL

    defs_all = (
        db.query(EventDefinition)
        .filter(
            EventDefinition.is_active == 1,
            or_(EventDefinition.mode == "game", EventDefinition.mode == "any"),
        )
        .all()
    )
    if not defs_all:
        logger.warning(
            "ensure_period_events: no definitions for profile=%s save_kind=%s",
            game_profile_id,
            save_kind,
        )
        return SPAWN_EMPTY_POOL

    counter_map = _load_event_counter_map(db, game_profile_id)
    profile_ctx = _load_event_profile_context(db, game_profile_id)
    needs_cfg = _needs_config_for_profile(db, profile)
    rescue_mult_by_id: dict[int, float] | None = None
    if needs_cfg:
        rescue_mult_by_id = {int(d.id): _rescue_weight_multiplier(d, needs_cfg=needs_cfg, profile=profile) for d in defs_all}

    repeat_ok: list[EventDefinition] = []
    for d in defs_all:
        if event_slot(d) != "period_choice":
            continue
        if not audience_matches(d, profile):
            continue
        if d.key in _PERIOD_EVENT_POOL_EXCLUDE_KEYS:
            continue
        if d.key in CHAIN_FOLLOWUP_EXCLUDE_FROM_RANDOM_POOL:
            continue
        if not _definition_prerequisites_met(d, profile_ctx):
            continue
        if not is_event_definition_eligible(
            repeat_policy=getattr(d, "repeat_policy", None),
            repeat_max=getattr(d, "repeat_max", None),
            cooldown_periods=int(getattr(d, "cooldown_periods", 0) or 0),
            current_period_index=int(period_index),
            counter=counter_map.get(int(d.id)),
        ):
            continue
        repeat_ok.append(d)

    if not repeat_ok:
        logger.error("ensure_period_events: repeat_ok empty profile=%s", game_profile_id)
        return SPAWN_EMPTY_POOL

    period_idx = max(1, int(period_index))
    base_k = min(EVENTS_PER_PERIOD, len(repeat_ok))

    # Приоритетные события (metadata.spawn_priority_when) занимают слоты первыми, мимо окна tier:
    # подсказка о дыре в бюджете и A1 «Вторая машина» при отрицательном потоке.
    # Приоритет — только если событие этому профилю ещё ни разу не выпадало: пропущенная подсказка
    # не возвращается каждый период и не вытесняет случайную колоду (ревью 2026-10-22).
    already_shown = {
        int(row.definition_id)
        for row in db.query(EventInstance.definition_id)
        .filter(EventInstance.game_profile_id == game_profile_id)
        .distinct()
        .all()
    }
    priority = sorted(
        (
            d
            for d in repeat_ok
            if int(d.id) not in already_shown
            and spawn_priority_active(_definition_meta(d).get("spawn_priority_when"), profile_ctx)
        ),
        key=lambda d: (_priority_rank(d), int(d.id)),
    )[:base_k]
    priority_ids = {int(d.id) for d in priority}
    # priority_only (подсказка о дыре в бюджете) не попадает в случайную колоду никогда.
    repeat_ok = [
        d for d in repeat_ok
        if int(d.id) not in priority_ids and not _definition_meta(d).get("priority_only")
    ]
    base_k -= len(priority)

    core = [d for d in repeat_ok if event_tier_in_core_window(_def_tier(d), period_idx)]

    if base_k <= 0:
        picked = []
    elif len(core) >= base_k:
        picked = _pick_diverse_period_events(core, base_k, counter_map, weight_multiplier_by_id=rescue_mult_by_id)
    else:
        p1 = [d for d in repeat_ok if event_tier_in_fallback_primary(_def_tier(d), period_idx)]
        if not p1:
            logger.error(
                "ensure_period_events: fallback P1 empty profile=%s period_index=%s",
                game_profile_id,
                period_idx,
            )
            p1 = [d for d in repeat_ok if _def_tier(d) == 1]
        if not p1 and not priority:
            return SPAWN_EMPTY_POOL
        kk = min(base_k, len(p1))
        picked = (
            _pick_diverse_period_events(p1, kk, counter_map, weight_multiplier_by_id=rescue_mult_by_id)
            if kk > 0
            else []
        )
    picked = priority + list(picked)

    for d in picked:
        inst = EventInstance(
            game_profile_id=game_profile_id,
            period_index=period_index,
            definition_id=d.id,
            status="pending",
        )
        db.add(inst)
        db.flush()
        attach_event_instance_choice_snapshot(db, profile, d, inst)

    db.commit()
    if _period_pool_instance_count(db, game_profile_id, period_index) < EVENTS_PER_PERIOD:
        logger.error(
            "ensure_period_events: underfilled profile=%s period_index=%s",
            game_profile_id,
            period_index,
        )
        return SPAWN_EMPTY_POOL
    return SPAWN_OK
