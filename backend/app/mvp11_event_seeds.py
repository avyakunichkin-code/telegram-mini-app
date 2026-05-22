"""
Идемпотентное наполнение каталога событий MVP 1.1 (≥12 defs, распределение tier).
Вызывается из routers.events._ensure_seed_events.
"""

from __future__ import annotations

import json

from sqlalchemy.orm import Session

from .models import EventDefinition, EventChoice

# Суммы в effects; на кнопках — короткий текст + impacts в API (см. event_choice_impacts).
MVP11_EVENT_SPECS: list[dict] = [
    {
        "key": "mq11_groceries_discount",
        "title": "Скидки в магазине",
        "description": "Сеть супермаркетов запустила акцию — можно сэкономить или взять запас.",
        "weight": 95,
        "event_tier": 1,
        "repeat_policy": "repeatable",
        "choices": [
            {"title": "Купить только нужное", "effects": {"cash_delta": -1500, "xp_delta": 2}},
            {"title": "Запас на месяц", "effects": {"cash_delta": -4200, "xp_delta": 1}},
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
            {
                "title": "Один сервис",
                "effects": {
                    "cash_delta": -599,
                    "expense_line": {
                        "category_key": "communications",
                        "amount_monthly": 400,
                        "title": "Стриминг",
                    },
                },
            },
            {
                "title": "Пакет «всё включено»",
                "effects": {
                    "cash_delta": -1290,
                    "expense_line": {
                        "category_key": "communications",
                        "amount_monthly": 900,
                        "title": "Пакет подписок",
                    },
                },
            },
            {
                "title": "Отменить все подписки",
                "effects": {"cash_delta": 0, "monthly_lifestyle_delta": -500, "xp_delta": 4},
            },
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
            {"title": "Продлить на год", "effects": {"cash_delta": -14900, "xp_delta": 3}},
            {"title": "Продлить на квартал", "effects": {"cash_delta": -4500, "xp_delta": 2}},
            {"title": "Не продлевать", "effects": {"cash_delta": 0, "xp_delta": 1}},
        ],
    },
    {
        "key": "mq11_transport_pass",
        "title": "Проездной на месяц",
        "description": "Транспортная карта: проездной или оплата поездок по факту.",
        "weight": 92,
        "event_tier": 1,
        "repeat_policy": "repeatable",
        "choices": [
            {"title": "Месячный проездной", "effects": {"cash_delta": -2800, "xp_delta": 2}},
            {"title": "Пополнить баланс карты", "effects": {"cash_delta": -900, "xp_delta": 1}},
            {"title": "Ходить пешком", "effects": {"cash_delta": 0, "xp_delta": 2}},
        ],
    },
    {
        "key": "mq11_pharmacy_stock",
        "title": "Аптечка и витамины",
        "description": "Сезон простуд — без базовой аптечки рискуете дороже лечиться позже.",
        "weight": 78,
        "event_tier": 1,
        "repeat_policy": "repeatable",
        "choices": [
            {"title": "Полный набор", "effects": {"cash_delta": -3200, "xp_delta": 2}},
            {"title": "Только необходимое", "effects": {"cash_delta": -1100, "xp_delta": 2}},
            {
                "title": "Обойтись без покупок",
                "effects": {
                    "cash_delta": -600,
                    "expense_line": {
                        "category_key": "health",
                        "amount_monthly": 450,
                        "title": "Лекарства по мере болезни",
                        "expires_after_periods": 1,
                    },
                    "xp_delta": 1,
                },
            },
        ],
    },
    {
        "key": "mq11_home_internet",
        "title": "Интернет дома",
        "description": "Провайдер предлагает повысить скорость или сменить тариф.",
        "weight": 86,
        "event_tier": 1,
        "repeat_policy": "repeatable",
        "choices": [
            {
                "title": "Тариф повыше",
                "effects": {
                    "cash_delta": -1490,
                    "expense_line": {
                        "category_key": "communications",
                        "amount_monthly": 500,
                        "title": "Интернет",
                    },
                    "xp_delta": 1,
                },
            },
            {"title": "Оставить как есть", "effects": {"cash_delta": 0, "xp_delta": 2}},
            {"title": "Перейти на более дешёвый", "effects": {"cash_delta": 0, "monthly_lifestyle_delta": -300, "xp_delta": 3}},
        ],
    },
    {
        "key": "mq11_sprain_leg",
        "title": "Травма: ушибили ногу",
        "description": "Сильный ушиб после падения. Без лечения ходить больно — отложить визит к врачу нельзя.",
        "weight": 72,
        "event_tier": 2,
        "repeat_policy": "repeatable",
        "cooldown_periods": 4,
        "mandatory_gate": "blocks_period_end",
        "choices": [
            {"title": "Травмпункт и перевязки", "effects": {"cash_delta": -8500, "xp_delta": 3}},
            {"title": "МРТ и ортез", "effects": {"cash_delta": -24000, "xp_delta": 5}},
            {
                "title": "Терпеть без врача",
                "effects": {
                    "cash_delta": -3000,
                    "expense_line": {
                        "category_key": "health",
                        "amount_monthly": 2800,
                        "title": "Лечение ноги",
                        "expires_after_periods": 2,
                    },
                    "xp_delta": 1,
                },
            },
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
            {"title": "Записаться на курс", "effects": {"cash_delta": -8900, "xp_delta": 8}},
            {"title": "Бесплатные материалы", "effects": {"cash_delta": 0, "xp_delta": 3}},
            {"title": "Отказаться", "effects": {"cash_delta": 0, "xp_delta": 1}},
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
            {"title": "Помочь полностью", "effects": {"cash_delta": -15000, "xp_delta": 5}},
            {"title": "Помочь частично", "effects": {"cash_delta": -7000, "xp_delta": 4}},
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
            {
                "title": "Подключить доп. покрытие",
                "effects": {
                    "expense_line": {
                        "category_key": "health",
                        "amount_monthly": 1200,
                        "title": "Доп. страховка",
                    },
                    "xp_delta": 2,
                },
            },
            {"title": "Только консультация", "effects": {"cash_delta": 0, "xp_delta": 2}},
            {"title": "Отказ", "effects": {"cash_delta": 0, "xp_delta": 1}},
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
            {"title": "Внести задаток", "effects": {"cash_delta": -120000, "xp_delta": 10}},
            {"title": "Попросить время на решение", "effects": {"cash_delta": 0, "xp_delta": 2}},
            {"title": "Отказаться от сделки", "effects": {"cash_delta": 0, "xp_delta": 1}},
        ],
    },
    {
        "key": "mq11_relocation_bonus",
        "title": "Смена города по работе",
        "description": "Работодатель предлагает релокацию: бонус на переезд и заметно более дорогая жизнь в новом городе.",
        "weight": 55,
        "event_tier": 4,
        "repeat_policy": "repeatable",
        "choices": [
            {
                "title": "Переехать в новый город",
                "description": "Бонус на переезд; расходы на жизнь вырастут примерно на четверть.",
                "effects": {
                    "cash_delta": 35000,
                    "monthly_burn_delta_pct": 0.28,
                    "xp_delta": 15,
                },
            },
            {"title": "Договориться об удалёнке", "effects": {"cash_delta": 12000, "xp_delta": 8}},
            {"title": "Остаться в текущем городе", "effects": {"cash_delta": 0, "xp_delta": 3}},
        ],
    },
    {
        "key": "mq11_refinance_bank",
        "title": "Предложение рефинансирования",
        "description": "Банк предлагает объединить платежи под новую ставку.",
        "weight": 58,
        "event_tier": 5,
        "repeat_policy": "repeatable",
        "prerequisites_json": {"min_active_liabilities": 1},
        "choices": [
            {"title": "Оформить пакет документов", "effects": {"cash_delta": -6500, "xp_delta": 12}},
            {"title": "Только консультация", "effects": {"cash_delta": 0, "xp_delta": 4}},
            {"title": "Отклонить предложение", "effects": {"cash_delta": 0, "xp_delta": 1}},
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
            {"title": "Платное участие", "effects": {"cash_delta": -3490, "xp_delta": 6}},
            {"title": "Бесплатная запись", "effects": {"cash_delta": 0, "xp_delta": 2}},
            {"title": "Не участвовать", "effects": {"cash_delta": 0, "xp_delta": 1}},
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
            {
                "title": "Переехать в квартиру меньше",
                "effects": {
                    "cash_delta": -35000,
                    "monthly_lifestyle_delta": -2500,
                    "xp_delta": 14,
                },
            },
            {"title": "Пока остаться", "effects": {"cash_delta": 0, "xp_delta": 2}},
            {
                "title": "Сдать комнату в субаренду",
                "effects": {
                    "cash_delta": 8000,
                    "expense_line": {
                        "category_key": "housing",
                        "amount_monthly": 600,
                        "title": "Субаренда",
                    },
                    "xp_delta": 9,
                },
            },
        ],
    },
    {
        "key": "mq11_car_accident",
        "title": "ДТП",
        "description": (
            "Столкновение на вашей машине. Нужно решить, как закрыть ущерб: "
            "через ОСАГО или за свой счёт — уйти без последствий не получится."
        ),
        "weight": 55,
        "event_tier": 3,
        "repeat_policy": "repeatable",
        "mandatory_gate": "blocks_period_end",
        "prerequisites_json": {"active_asset_kinds_any": ["car_personal", "car_taxi"]},
        "choices": [
            {
                "title": "Оформить по полису ОСАГО",
                "effects": {
                    "insurance_claim": {"product": "auto", "insured_object": "liability"},
                    "xp_delta": 4,
                },
            },
            {
                "title": "Оплатить ремонт из своих",
                "effects": {"cash_delta": -45000, "xp_delta": 2},
            },
        ],
    },
    {
        "key": "mq11_home_water_damage",
        "title": "Затопило квартиру",
        "description": (
            "Прорвало трубу — пострадало ваше жильё. Нужно восстановить квартиру: "
            "через страховку имущества или полностью за свой счёт."
        ),
        "weight": 50,
        "event_tier": 3,
        "repeat_policy": "repeatable",
        "mandatory_gate": "blocks_period_end",
        "prerequisites_json": {"active_asset_kinds_any": ["home", "rental_home"]},
        "choices": [
            {
                "title": "Вызвать страховую (имущество)",
                "effects": {
                    "insurance_claim": {"product": "property", "insured_object": "property"},
                    "xp_delta": 4,
                },
            },
            {
                "title": "Ремонт за свой счёт",
                "effects": {"cash_delta": -80000, "xp_delta": 2},
            },
        ],
    },
    {
        "key": "mq11_events_unlock_intro",
        "title": "События месяца открылись",
        "description": (
            "Монетка: с 2-го уровня в каждом периоде появляются сюжетные ситуации — "
            "до двух за период; решения влияют на деньги, подушку и опыт. "
            "Это разовая подсказка перед обычной колодой."
        ),
        "weight": 1,
        "event_tier": 1,
        "repeat_policy": "once_per_profile",
        "choices": [
            {"title": "Понятно, буду смотреть", "effects": {"xp_delta": 3}},
            {"title": "Звучит интересно", "effects": {"xp_delta": 2}},
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
            {"title": "Подарок и поездка", "effects": {"cash_delta": -22000, "xp_delta": 6}},
            {"title": "Только подарок", "effects": {"cash_delta": -8000, "xp_delta": 5}},
            {"title": "Поздравить дистанционно", "effects": {"cash_delta": -2000, "xp_delta": 3}},
        ],
    },
]


def ensure_mvp11_event_catalog(db: Session) -> None:
    """Добавляет отсутствующие определения и обновляет tier/repeat у существующих по ключу."""
    for spec in MVP11_EVENT_SPECS:
        existing = db.query(EventDefinition).filter(EventDefinition.key == spec["key"]).first()
        if existing:
            existing.title = spec["title"]
            existing.description = spec["description"]
            existing.event_tier = int(spec.get("event_tier", 1))
            existing.repeat_policy = str(spec.get("repeat_policy", "repeatable"))
            existing.repeat_max = spec.get("repeat_max")
            existing.cooldown_periods = int(spec.get("cooldown_periods", 0) or 0)
            existing.mandatory_gate = str(spec.get("mandatory_gate", "none"))
            existing.weight = int(spec.get("weight", 100))
            if "prerequisites_json" in spec:
                existing.prerequisites_json = json.dumps(
                    spec.get("prerequisites_json") or {}, ensure_ascii=False
                )
            spec_choices = list(spec.get("choices") or [])
            existing_choices = (
                db.query(EventChoice)
                .filter(EventChoice.definition_id == existing.id)
                .order_by(EventChoice.id.asc())
                .all()
            )
            for idx, ch in enumerate(spec_choices):
                if idx < len(existing_choices):
                    existing_choices[idx].title = ch["title"]
                    existing_choices[idx].description = ch.get("description", "")
                    existing_choices[idx].effects_json = json.dumps(
                        ch.get("effects", {}), ensure_ascii=False
                    )
                else:
                    db.add(
                        EventChoice(
                            definition_id=existing.id,
                            title=ch["title"],
                            description=ch.get("description", ""),
                            effects_json=json.dumps(ch.get("effects", {}), ensure_ascii=False),
                        )
                    )
            for extra in existing_choices[len(spec_choices) :]:
                db.delete(extra)
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
            prerequisites_json=json.dumps(spec.get("prerequisites_json") or {}, ensure_ascii=False),
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
