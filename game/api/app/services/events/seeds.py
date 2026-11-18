"""Минимальный сид событий для пустой БД."""
import json

from sqlalchemy.orm import Session

from ...events.mvp11_seeds import ensure_mvp11_event_catalog
from ...models import EventChoice, EventDefinition


def _ensure_seed_events(db: Session) -> None:
    """
    Минимальный набор событий, если БД пуста; затем каталог MVP 1.1.

    Синк YAML → БД для непустой БД — только на старте API (seeds.runner.seed_events)
    и `db.sh events-sync`, не на hot path (закрытие месяца, GET pending).
    """
    if db.query(EventDefinition.id).limit(1).first() is not None:
        return

    def add_event(
        key: str,
        title: str,
        description: str,
        choices: list[dict],
        weight: int = 100,
        *,
        mandatory_gate: str = "none",
    ):
        ed = EventDefinition(
            key=key,
            mode="any",
            title=title,
            description=description,
            weight=weight,
            is_active=1,
            event_tier=1,
            repeat_policy="repeatable",
            mandatory_gate=mandatory_gate,
        )
        db.add(ed)
        db.flush()
        for ch in choices:
            db.add(
                EventChoice(
                    definition_id=ed.id,
                    title=ch["title"],
                    description=ch.get("description", ""),
                    effects_json=json.dumps(ch.get("effects", {}), ensure_ascii=False),
                )
            )

    add_event(
        key="broken_phone",
        title="Сломался телефон",
        description="Телефон не включается — без связи сложно работать и оплачивать счета.",
        weight=120,
        mandatory_gate="blocks_period_end",
        choices=[
            {"title": "Починить в сервисе", "effects": {"cash_delta": -3000, "xp_delta": 2}},
            {"title": "Купить новый", "effects": {"cash_delta": -12000, "xp_delta": 1}},
            {
                "title": "Временный б/у аппарат",
                "effects": {
                    "cash_delta": -4500,
                    "expense_line": {
                        "category_key": "communications",
                        "amount_monthly": 800,
                        "title": "Связь (б/у)",
                        "expires_after_periods": 2,
                    },
                    "xp_delta": 1,
                },
            },
        ],
    )
    add_event(
        key="tax_refund",
        title="Налоговый вычет",
        description="Вам одобрили небольшой налоговый вычет.",
        weight=60,
        choices=[
            {"title": "Забрать на баланс (+5 000 ₽)", "effects": {"cash_delta": 5000}},
            {"title": "Сразу в подушку (+5 000 ₽)", "effects": {"safety_grant": 5000}},
        ],
    )
    add_event(
        key="friend_offer",
        title="Предложение подработки",
        description="Друг предлагает подработку на выходных. Это потребует времени, но даст деньги.",
        weight=90,
        choices=[
            {"title": "Согласиться (+4 000 ₽)", "effects": {"cash_delta": 4000}},
            {"title": "Отказаться (0 ₽)", "effects": {"cash_delta": 0}},
        ],
    )

    db.commit()

    ensure_mvp11_event_catalog(db)
