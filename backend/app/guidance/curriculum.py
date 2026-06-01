"""Канон curriculum O2 — зеркало frontend-react/src/guidance/curriculum.js."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

GateKind = Literal[
    "read",
    "action_salary",
    "action_cushion",
    "action_close",
    "action_event",
    "action_treat_self",
    "farewell",
]


@dataclass(frozen=True)
class GuidanceBeat:
    id: str
    period_index: int
    module_step: int
    module_step_count: int
    gate: GateKind
    title: str
    body: str
    debrief_body: str | None = None


CURRICULUM: tuple[GuidanceBeat, ...] = (
    GuidanceBeat(
        id="p1_period",
        period_index=1,
        module_step=1,
        module_step_count=4,
        gate="read",
        title="Привет!",
        body=(
            "Игра идёт **периодами** — как месяцы. Слева «Месяц открыт», справа — "
            "**«Закрыть месяц»**, когда закончишь дела.\n\n"
            "План на старт: **Зарплата** → **В подушку** → **Закрыть месяц**."
        ),
    ),
    GuidanceBeat(
        id="p1_salary",
        period_index=1,
        module_step=2,
        module_step_count=4,
        gate="action_salary",
        title="Зарплата не сама",
        body=(
            "Зарплату забираешь **сам** — кнопкой **«Зарплата»**. "
            "Не нажал до конца месяца — за период не повторится."
        ),
    ),
    GuidanceBeat(
        id="p1_cushion",
        period_index=1,
        module_step=3,
        module_step_count=4,
        gate="action_cushion",
        title="Фин.подушка",
        body="**«Пополнить»** подушку — запас на чёрный день. Закинь хоть немного, если есть лишнее на счёте.",
    ),
    GuidanceBeat(
        id="p1_close",
        period_index=1,
        module_step=4,
        module_step_count=4,
        gate="action_close",
        title="Закрыть месяц",
        body=(
            "В **конце месяца** автоматически спишутся расходы на жизнь, обязательства и содержание — "
            "даже если в течение месяца баланс был в плюсе.\n\n"
            "Когда готов — жми **«Закрыть месяц»** в шапке."
        ),
        debrief_body=(
            "Вот что списалось в этом ходе. Смотри на цифры после закрытия — "
            "так проще понять, куда ушли деньги."
        ),
    ),
    GuidanceBeat(
        id="p2_events_intro",
        period_index=2,
        module_step=1,
        module_step_count=2,
        gate="action_event",
        title="Жизненные ситуации",
        body=(
            "Карточки событий — это **решения**: нажимай кнопки с суммами и последствиями, "
            "а не только листай."
        ),
    ),
    GuidanceBeat(
        id="p2_events_done",
        period_index=2,
        module_step=2,
        module_step_count=2,
        gate="read",
        title="Отлично",
        body="Ты принял решение в ситуации — так и задумано. Дальше играй сам.",
    ),
    GuidanceBeat(
        id="p3_needs",
        period_index=3,
        module_step=1,
        module_step_count=2,
        gate="read",
        title="Характеристики",
        body=(
            "Четыре шкалы — баланс жизни: комфорт, статус, связи, здоровье. "
            "Справа в шапке: **книга с «?»** — справочник по шкалам; **сердце** — улучшить потребности, когда доступно."
        ),
    ),
    GuidanceBeat(
        id="p3_farewell",
        period_index=3,
        module_step=2,
        module_step_count=2,
        gate="farewell",
        title="Удачи в квесте",
        body=(
            "Ну всё, я побежала к своим целям — **вперёд, начинай игру**. "
            "Ошибаться можно, главное — смотреть, *почему* сдвинулись цифры."
        ),
    ),
)

BEAT_BY_ID = {b.id: b for b in CURRICULUM}


def beats_for_period(period_index: int) -> list[GuidanceBeat]:
    pi = max(1, min(3, int(period_index or 1)))
    return [b for b in CURRICULUM if b.period_index == pi]


def all_beat_ids() -> frozenset[str]:
    return frozenset(BEAT_BY_ID.keys())
