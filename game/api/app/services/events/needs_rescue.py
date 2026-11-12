"""Needs-aware rescue: конфиг needs профиля, min-ось, усиление rescue-событий."""
import json

from sqlalchemy.orm import Session

from ...events.taxonomy import parse_event_metadata
from ...models import EventDefinition, GameProfile, GameStarterTemplate
from ...needs.engine import AXES as NEEDS_AXES, needs_values_from_profile, parse_needs_config


def _needs_config_for_profile(db: Session, profile: GameProfile) -> dict | None:
    if str(getattr(profile, "save_kind", "game") or "game") != "game":
        return None
    tk = str(getattr(profile, "starter_template_key", "") or "").strip()
    if not tk:
        return None
    tmpl = (
        db.query(GameStarterTemplate)
        .filter(GameStarterTemplate.template_key == tk)
        .first()
    )
    if not tmpl:
        return None
    try:
        blueprint = json.loads(tmpl.blueprint_json or "{}")
    except json.JSONDecodeError:
        blueprint = {}
    return parse_needs_config(blueprint)


NEEDS_AXIS_LABELS: dict[str, str] = {
    "comfort": "Комфорт",
    "status": "Статус",
    "social": "Связи",
    "health": "Здоровье",
}


def _needs_rescue_min_axis(needs_cfg: dict | None, profile: GameProfile) -> str | None:
    """Ось с минимальным значением, если игрок в зоне rescue (distressed или 0); иначе None."""
    if not needs_cfg:
        return None
    thresholds = needs_cfg.get("thresholds") if isinstance(needs_cfg.get("thresholds"), dict) else {}
    distressed_thr = int(thresholds.get("distressed") or 30)
    before = needs_values_from_profile(profile)
    has_zero = any(float(before.get(k) or 0) <= 0.0 for k in NEEDS_AXES)
    is_distressed = any(
        0.0 < float(before.get(k) or 0) < float(distressed_thr) for k in NEEDS_AXES
    )
    if not (has_zero or is_distressed):
        return None
    return min(NEEDS_AXES, key=lambda k: float(before.get(k) or 0))


def _event_rescue_matches_min_axis(defn: EventDefinition, min_axis: str) -> bool:
    meta = parse_event_metadata(getattr(defn, "metadata_json", None))
    if meta.get("is_rescue") is not True:
        return False
    rescue_axes = meta.get("rescue_axes")
    if isinstance(rescue_axes, list) and rescue_axes:
        return min_axis in {str(x) for x in rescue_axes}
    return True


def _rescue_weight_multiplier(
    defn: EventDefinition,
    *,
    needs_cfg: dict | None,
    profile: GameProfile,
) -> float:
    """
    Если needs просели, усиливаем rescue-события (content) через rescue_event_bias.
    Rescue-событие помечаем в metadata_json: {"is_rescue": true, "rescue_axes": ["social", ...]}.
    """
    min_axis = _needs_rescue_min_axis(needs_cfg, profile)
    if not min_axis or not _event_rescue_matches_min_axis(defn, min_axis):
        return 1.0
    before = needs_values_from_profile(profile)
    has_zero = any(float(before.get(k) or 0) <= 0.0 for k in NEEDS_AXES)
    bias = float(needs_cfg.get("player_support", {}).get("rescue_event_bias") or 1.0)
    severity = 2.0 if has_zero else 1.5
    return max(1.0, bias * severity)
