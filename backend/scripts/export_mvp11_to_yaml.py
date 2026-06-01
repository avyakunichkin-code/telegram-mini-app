"""
Сервисный ре-экспорт загруженного каталога → data/events/mvp11/*.yaml.
Обычно канон уже в YAML; скрипт для массового переноса/реорганизации файлов.
Запуск из backend/: python scripts/export_mvp11_to_yaml.py
"""

from __future__ import annotations

import sys
from pathlib import Path

import yaml

BACKEND = Path(__file__).resolve().parents[1]
ROOT = BACKEND.parent
if str(BACKEND) not in sys.path:
    sys.path.insert(0, str(BACKEND))

from app.events.mvp11_seeds import EVENT_TAXONOMY, MVP11_EVENT_SPECS  # noqa: E402

OUT = ROOT / "data" / "events" / "mvp11"

# key → относительный путь файла (порядок внутри файла = порядок в списке)
FILE_KEYS: dict[str, list[str]] = {
    "consumption.yaml": [
        "mq11_groceries_discount",
        "mq11_streaming_offer",
        "mq11_gym_membership",
        "mq11_transport_pass",
        "mq11_coffee_takeaway",
        "mq11_clothing_clearance",
        "mq11_food_delivery_promo",
        "mq11_appliance_sale",
    ],
    "health.yaml": [
        "mq11_pharmacy_stock",
        "mq11_sprain_leg",
        "mq11_rescue_easy_walk",
    ],
    "housing.yaml": [
        "mq11_home_internet",
        "mq11_relocation_bonus",
        "mq11_downsize_flat",
        "mq11_home_water_damage",
    ],
    "social_family.yaml": [
        "mq11_rescue_friend_call",
        "mq11_friend_outing_student",
        "mq11_wedding_gift_once",
    ],
    "investment_education.yaml": [
        "mq11_evening_course",
        "mq11_investment_webinar",
    ],
    "insurance.yaml": ["mq11_insurance_agent"],
    "auto.yaml": ["mq11_car_accident"],
    "credit_debt.yaml": ["mq11_refinance_bank"],
    "chains/family_money.yaml": [
        "mq11_family_money_request",
        "mq11_family_money_callback",
    ],
    "chains/used_car.yaml": [
        "mq11_used_car_offer",
        "mq11_used_car_deadline",
    ],
    "meta/unlock_intro.yaml": ["mq11_events_unlock_intro"],
}

SPEC_BY_KEY = {s["key"]: s for s in MVP11_EVENT_SPECS}


def _spec_to_yaml_event(spec: dict) -> dict:
    key = spec["key"]
    meta = dict(EVENT_TAXONOMY.get(key) or {})
    event: dict = {
        "definition_key": key,
        "event_domain": meta.get("event_domain", "consumption"),
        "title": spec["title"],
        "description": spec["description"],
        "weight": spec.get("weight", 100),
        "event_tier": spec.get("event_tier", 1),
        "repeat_policy": spec.get("repeat_policy", "repeatable"),
    }
    if meta.get("interaction_kind") and meta["interaction_kind"] != "choice":
        event["interaction_kind"] = meta["interaction_kind"]
    if meta.get("scenario_shape"):
        event["scenario_shape"] = meta["scenario_shape"]
    extra = {
        k: v
        for k, v in meta.items()
        if k not in ("event_domain", "interaction_kind", "scenario_shape")
    }
    if extra:
        event["extra"] = extra
    for field in (
        "cooldown_periods",
        "repeat_max",
        "mandatory_gate",
        "is_active",
    ):
        if field in spec:
            event[field] = spec[field]
    if spec.get("prerequisites_json"):
        event["prerequisites"] = spec["prerequisites_json"]
    choices = []
    for ch in spec.get("choices") or []:
        choice = {"title": ch["title"], "effects": dict(ch.get("effects") or {})}
        if ch.get("description"):
            choice["description"] = ch["description"]
        choices.append(choice)
    event["choices"] = choices
    return event


def main() -> None:
    includes: list[str] = []
    for rel_path, keys in FILE_KEYS.items():
        path = OUT / rel_path
        path.parent.mkdir(parents=True, exist_ok=True)
        events = [_spec_to_yaml_event(SPEC_BY_KEY[k]) for k in keys]
        path.write_text(
            yaml.dump(
                {"events": events},
                allow_unicode=True,
                sort_keys=False,
                default_flow_style=False,
                width=100,
            ),
            encoding="utf-8",
        )
        includes.append(rel_path.replace("\\", "/"))
        print("wrote", path)

    catalog = {
        "catalog": "mvp11",
        "version": 1,
        "includes": includes,
    }
    catalog_path = OUT / "catalog.yaml"
    catalog_path.write_text(
        yaml.dump(catalog, allow_unicode=True, sort_keys=False),
        encoding="utf-8",
    )
    print("wrote", catalog_path)


if __name__ == "__main__":
    main()
