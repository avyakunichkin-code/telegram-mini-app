"""O3 contextual triggers — после spine (P1+P2)."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

TriggerGate = Literal["read", "action_event", "farewell"]


@dataclass(frozen=True)
class GuidanceTrigger:
    id: str
    order: int
    gate: TriggerGate
    title: str
    body: str
    screen: str | None = None


TRIGGERS: tuple[GuidanceTrigger, ...] = (
    GuidanceTrigger(
        id="t_events_intro",
        order=1,
        gate="action_event",
        title="Жизнь подкидывает задачи",
        body=(
            "С **хода №3** подключаются карточки событий — это **решения**, не просто листание. "
            "Смотри на суммы и стрелочки: они меняют **твой** баланс и расходы.\n\n"
            "**Сейчас: открой «События» и нажми один из вариантов ответа.**"
        ),
    ),
    GuidanceTrigger(
        id="t_finance_actions",
        order=2,
        gate="read",
        screen="finance:actions",
        title="Здесь оформляешь",
        body=(
            "Я только что поняла: вкладка **«Капитал»** делится на **Детали** (что уже есть) "
            "и **Действия** (что можно сделать). Ты на **Действиях** — депозит, облигации, позже ещё больше.\n\n"
            "**Нажми «Понятно»** и посмотри плитки — никуда не гоню, исследуй сам."
        ),
    ),
    GuidanceTrigger(
        id="t_finance_details",
        order=3,
        gate="read",
        screen="finance:details",
        title="А здесь — твой портфель",
        body=(
            "**Детали** — это всё, что уже завёл: позиции, полисы, активы. "
            "Пусто? Нормально — вернись в **Действия** и добавь первое.\n\n"
            "**Нажми «Понятно»**, когда осмотришься."
        ),
    ),
    GuidanceTrigger(
        id="t_needs",
        order=4,
        gate="read",
        screen="needs",
        title="Четыре шкалы жизни",
        body=(
            "Комфорт, статус, связи, здоровье — не просто цифры. Если проседают, "
            "жизнь давит сильнее. **Книга с «?»** — моя шпаргалка; **сердце** — иногда можно себя порадовать.\n\n"
            "**Нажми «Понятно»** — дальше следи за шкалами сам."
        ),
    ),
    GuidanceTrigger(
        id="t_farewell",
        order=5,
        gate="farewell",
        title="Твой ход дальше",
        body=(
            "Ну всё, базу я показала — **дальше играй сам**. Ошибаться можно: "
            "главное смотреть, *почему* сдвинулись цифры после закрытия месяца.\n\n"
            "**Нажми «Понятно»** — удачи в квесте!"
        ),
    ),
)

TRIGGERS_BY_ID = {t.id: t for t in TRIGGERS}
TRIGGER_IDS = frozenset(TRIGGERS_BY_ID.keys())

O2_BEAT_TO_TRIGGER = {
    "p2_events_intro": "t_events_intro",
    "p2_events_done": "t_events_intro",
    "p3_needs": "t_needs",
    "p3_farewell": "t_farewell",
}
