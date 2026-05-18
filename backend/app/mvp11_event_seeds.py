"""
Идемпотентное наполнение каталога событий MVP 1.1 (≥12 defs, распределение tier).
Вызывается из routers.events._ensure_seed_events.
"""

from __future__ import annotations

import json

from sqlalchemy.orm import Session

from .models import EventDefinition, EventChoice

MVP11_EVENT_SPECS: list[dict] = [
    {
        "key": "mq11_groceries_discount",
        "title": "Скидки в магазине",
        "description": "Сеть супермаркетов запустила акцию. Можно немного сэкономить или купить запас.",
        "weight": 95,
        "event_tier": 1,
        "repeat_policy": "repeatable",
        "choices": [
            {"title": "Купить только нужное (−1 500 ₽)", "effects": {"cash_delta": -1500, "xp_delta": 2}},
            {"title": "Запас на месяц (−4 200 ₽)", "effects": {"cash_delta": -4200, "xp_delta": 1}},
            {"title": "Обойтись без покупок", "effects": {"cash_delta": 0, "xp_delta": 3}},
        ],
    },
    {
        "key": "mq11_streaming_offer",
        "title": "Подписки на сервисы",
        "description": "Несколько стриминговых сервисов напомнили о продлении.",
        "weight": 85,
        "event_tier": 1,
        "repeat_policy": "repeatable",
        "choices": [
            {"title": "Один сервис (−599 ₽)", "effects": {"cash_delta": -599, "monthly_lifestyle_delta": 400}},
            {"title": "Пакет «всё включено» (−1 290 ₽)", "effects": {"cash_delta": -1290, "monthly_lifestyle_delta": 900}},
            {"title": "Отменить всё", "effects": {"cash_delta": 0, "monthly_lifestyle_delta": -500, "xp_delta": 4}},
        ],
    },
    {
        "key": "mq11_gym_membership",
        "title": "Абонемент в спортзал",
        "description": "Зал предлагает продлить членство со скидкой.",
        "weight": 80,
        "event_tier": 1,
        "repeat_policy": "repeatable",
        "choices": [
            {"title": "Продлить год (−14 900 ₽)", "effects": {"cash_delta": -14900, "xp_delta": 3}},
            {"title": "Квартал (−4 500 ₽)", "effects": {"cash_delta": -4500, "xp_delta": 2}},
            {"title": "Пока без спорта", "effects": {"cash_delta": 0, "xp_delta": 1}},
        ],
    },
    {
        "key": "mq11_evening_course",
        "title": "Короткий курс по вечерам",
        "description": "Онлайн-курс по навыку, который может пригодиться на работе.",
        "weight": 88,
        "event_tier": 2,
        "repeat_policy": "repeatable",
        "choices": [
            {"title": "Записаться (−8 900 ₽)", "effects": {"cash_delta": -8900, "xp_delta": 8}},
            {"title": "Бесплатные материалы", "effects": {"cash_delta": 0, "xp_delta": 3}},
            {"title": "Не сейчас", "effects": {"cash_delta": 0}},
        ],
    },
    {
        "key": "mq11_family_money_request",
        "title": "Просьба о помощи от родственника",
        "description": "Близкий человек просит небольшую сумму в затруднительной ситуации.",
        "weight": 75,
        "event_tier": 2,
        "repeat_policy": "repeatable",
        "choices": [
            {"title": "Помочь (−15 000 ₽)", "effects": {"cash_delta": -15000, "xp_delta": 5}},
            {"title": "Часть суммы (−7 000 ₽)", "effects": {"cash_delta": -7000, "xp_delta": 4}},
            {"title": "Отказаться вежливо", "effects": {"cash_delta": 0, "xp_delta": 1}},
        ],
    },
    {
        "key": "mq11_insurance_agent",
        "title": "Страховой агент",
        "description": "Предлагают расширить покрытие с небольшой ежемесячной доплатой.",
        "weight": 70,
        "event_tier": 3,
        "repeat_policy": "repeatable",
        "choices": [
            {"title": "Подключить (+1 200 ₽/мес к «жизни»)", "effects": {"monthly_lifestyle_delta": 1200, "xp_delta": 2}},
            {"title": "Только консультация", "effects": {"cash_delta": 0, "xp_delta": 2}},
            {"title": "Отказ", "effects": {"cash_delta": 0}},
        ],
    },
    {
        "key": "mq11_used_car_offer",
        "title": "Предложение о подержанном авто",
        "description": "Удачная сделка на авто с пробегом — нужен сразу платёж.",
        "weight": 65,
        "event_tier": 3,
        "repeat_policy": "repeatable",
        "choices": [
            {"title": "Внести задаток (−120 000 ₽)", "effects": {"cash_delta": -120000, "xp_delta": 10}},
            {"title": "Попросить время", "effects": {"cash_delta": 0, "xp_delta": 2}},
            {"title": "Отказаться", "effects": {"cash_delta": 0}},
        ],
    },
    {
        "key": "mq11_relocation_bonus",
        "title": "Смена города по работе",
        "description": "Работодатель предлагает релокацию с бонусом и компенсацией расходов.",
        "weight": 55,
        "event_tier": 4,
        "repeat_policy": "repeatable",
        "choices": [
            {"title": "Принять (+85 000 ₽ и дорожная «жизнь»)", "effects": {"cash_delta": 85000, "monthly_lifestyle_delta": 3500, "xp_delta": 15}},
            {"title": "Обсудить удалёнку", "effects": {"cash_delta": 12000, "xp_delta": 8}},
            {"title": "Остаться", "effects": {"cash_delta": 0, "xp_delta": 3}},
        ],
    },
    {
        "key": "mq11_refinance_bank",
        "title": "Предложение рефинансирования",
        "description": "Банк предлагает объединить платежи под новую ставку.",
        "weight": 58,
        "event_tier": 5,
        "repeat_policy": "repeatable",
        "choices": [
            {"title": "Оформить пакет документов (−6 500 ₽)", "effects": {"cash_delta": -6500, "xp_delta": 12}},
            {"title": "Только консультация", "effects": {"cash_delta": 0, "xp_delta": 4}},
            {"title": "Отложить", "effects": {"cash_delta": 0}},
        ],
    },
    {
        "key": "mq11_investment_webinar",
        "title": "Вебинар по инвестициям",
        "description": "Платный вебинар с обещанием «простой стратегии».",
        "weight": 62,
        "event_tier": 4,
        "repeat_policy": "repeatable",
        "choices": [
            {"title": "Участие (−3 490 ₽)", "effects": {"cash_delta": -3490, "xp_delta": 6}},
            {"title": "Бесплатная запись", "effects": {"cash_delta": 0, "xp_delta": 2}},
            {"title": "Игнорировать", "effects": {"cash_delta": 0}},
        ],
    },
    {
        "key": "mq11_downsize_flat",
        "title": "Переезд в квартиру меньше",
        "description": "Можно снизить аренду, но нужны расходы на переезд.",
        "weight": 52,
        "event_tier": 5,
        "repeat_policy": "repeatable",
        "choices": [
            {"title": "Переезд (−35 000 ₽, ниже «жизнь»)", "effects": {"cash_delta": -35000, "monthly_lifestyle_delta": -2500, "xp_delta": 14}},
            {"title": "Пока остаться", "effects": {"cash_delta": 0, "xp_delta": 2}},
            {"title": "Субаренда комнаты", "effects": {"cash_delta": 8000, "monthly_lifestyle_delta": 600, "xp_delta": 9}},
        ],
    },
    {
        "key": "mq11_car_accident",
        "title": "ДТП",
        "description": "Небольшое столкновение. При ОСАГО страховая покроет ущерб третьим лицам.",
        "weight": 55,
        "event_tier": 3,
        "repeat_policy": "repeatable",
        "choices": [
            {
                "title": "Оформить по полису ОСАГО",
                "effects": {
                    "insurance_claim": {"product": "auto", "insured_object": "liability"},
                    "xp_delta": 4,
                },
            },
            {
                "title": "Оплатить из своих (−45 000 ₽)",
                "effects": {"cash_delta": -45000, "xp_delta": 2},
            },
            {
                "title": "Договориться без оформления",
                "effects": {"cash_delta": -12000, "xp_delta": 1},
            },
        ],
    },
    {
        "key": "mq11_home_water_damage",
        "title": "Затопило квартиру",
        "description": "Прорвало трубу у соседей. Страховка имущества поможет восстановить ремонт.",
        "weight": 50,
        "event_tier": 3,
        "repeat_policy": "repeatable",
        "choices": [
            {
                "title": "Вызвать страховую (имущество)",
                "effects": {
                    "insurance_claim": {"product": "property", "insured_object": "property"},
                    "xp_delta": 4,
                },
            },
            {
                "title": "Ремонт за свой счёт (−80 000 ₽)",
                "effects": {"cash_delta": -80000, "xp_delta": 2},
            },
            {
                "title": "Косметический ремонт (−25 000 ₽)",
                "effects": {"cash_delta": -25000, "xp_delta": 1},
            },
        ],
    },
    {
        "key": "mq11_wedding_gift_once",
        "title": "Свадьба друга (разовый сценарий)",
        "description": "Приглашение на праздник — подарок и поездка.",
        "weight": 40,
        "event_tier": 2,
        "repeat_policy": "once_per_profile",
        "choices": [
            {"title": "Подарок и поездка (−22 000 ₽)", "effects": {"cash_delta": -22000, "xp_delta": 6}},
            {"title": "Только подарок (−8 000 ₽)", "effects": {"cash_delta": -8000, "xp_delta": 5}},
            {"title": "Поздравить дистанционно", "effects": {"cash_delta": -2000, "xp_delta": 3}},
        ],
    },
]


def ensure_mvp11_event_catalog(db: Session) -> None:
    """Добавляет отсутствующие определения и обновляет tier/repeat у существующих по ключу."""
    for spec in MVP11_EVENT_SPECS:
        existing = db.query(EventDefinition).filter(EventDefinition.key == spec["key"]).first()
        if existing:
            existing.event_tier = int(spec.get("event_tier", 1))
            existing.repeat_policy = str(spec.get("repeat_policy", "repeatable"))
            existing.repeat_max = spec.get("repeat_max")
            existing.cooldown_periods = int(spec.get("cooldown_periods", 0) or 0)
            existing.mandatory_gate = str(spec.get("mandatory_gate", "none"))
            existing.weight = int(spec.get("weight", 100))
            continue
        ed = EventDefinition(
            key=spec["key"],
            mode="any",
            title=spec["title"],
            description=spec["description"],
            weight=int(spec.get("weight", 100)),
            is_active=1,
            event_tier=int(spec.get("event_tier", 1)),
            repeat_policy=str(spec.get("repeat_policy", "repeatable")),
            repeat_max=spec.get("repeat_max"),
            cooldown_periods=int(spec.get("cooldown_periods", 0) or 0),
            mandatory_gate=str(spec.get("mandatory_gate", "none")),
        )
        db.add(ed)
        db.flush()
        for ch in spec["choices"]:
            db.add(
                EventChoice(
                    definition_id=ed.id,
                    title=ch["title"],
                    description=ch.get("description", ""),
                    effects_json=json.dumps(ch.get("effects", {}), ensure_ascii=False),
                )
            )
    db.commit()
