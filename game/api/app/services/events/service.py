"""События: пул периода, pending payload, выбор.

Фасад пакета: реализация разнесена по модулям, здесь — реэкспорт для существующих импортов.

- needs_rescue — needs-конфиг профиля и усиление rescue-событий
- selection    — взвешенная выборка, контекст и счётчики профиля
- seeds        — минимальный сид для пустой БД
- spawn        — intro, спавн событий периода, expire
- payload      — сериализация и GET pending
- choose       — выбор варианта и применение эффектов

Патчить в тестах нужно модуль, где имя используется (например ``app.services.events.spawn``),
а не этот фасад — подмена здесь не повлияет на вызовы внутри пакета.
"""
from .choose import (
    CHOOSE_ROUTE_KEY,
    _apply_event_choice,
    _apply_expense_line_effect,
    _choose_replay_or_gone,
    _clamp_expense_line_amount,
    _lock_event_instance,
    choose_event,
    choose_idempotency_key,
)
from .needs_rescue import (
    NEEDS_AXIS_LABELS,
    _event_rescue_matches_min_axis,
    _needs_config_for_profile,
    _needs_rescue_min_axis,
    _rescue_weight_multiplier,
)
from .payload import (
    _order_events_recommended_first,
    build_pending_events_payload,
    serialize_instance_rows,
)
from .seeds import _ensure_seed_events
from .selection import (
    _def_tier,
    _definition_prerequisites_met,
    _load_event_counter_map,
    _load_event_profile_context,
    _pick_diverse_period_events,
    _weighted_sample_without_replacement,
    record_event_profile_selection,
)
from .spawn import (
    SPAWN_ALREADY_FULL,
    SPAWN_EMPTY_POOL,
    SPAWN_OK,
    SPAWN_SKIPPED_INTRO,
    _o2_guidance_replaces_events_intro,
    _PERIOD_EVENT_POOL_EXCLUDE_KEYS,
    _period_pool_instance_count,
    ensure_events_unlock_intro,
    ensure_period_events,
    expire_pending_events_for_closed_period,
    is_events_spawn_failed,
    logger,
)
