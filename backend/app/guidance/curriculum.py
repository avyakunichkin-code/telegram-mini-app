"""Канон curriculum O3 spine — зеркало frontend-react/src/guidance/curriculum.js."""
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
        module_step_count=5,
        gate="read",
        title="Эй, это твой ход",
        body=(
            "Игра идёт **ходами** — один ход это цикл «решения → списания → новый ход». "
            "Слева **«Ход в процессе»**, справа будет **«Завершить ход»**.\n\n"
            "Сейчас просто осмотрись — цифры на экране **твои**, не чужие.\n\n"
            "**Нажми «Понятно»**, когда готов двигаться дальше."
        ),
    ),
    GuidanceBeat(
        id="p1_flows",
        period_index=1,
        module_step=2,
        module_step_count=5,
        gate="read",
        title="Откуда деньги и куда утекают",
        body=(
            "Я только что поняла, как тут устроено: **Доходы** — сколько приходит за ход "
            "(зарплата ~**62 500 ₽**), **Расходы** — сколько **спишется в конце** хода "
            "(жизнь ~**37 500 ₽**). Пока они на экране — это **план**, не мгновенный удар по счёту.\n\n"
            "Серые кнопки внизу — значит, **ещё рано**; я подскажу, когда нажимать.\n\n"
            "**Нажми «Понятно»**."
        ),
    ),
    GuidanceBeat(
        id="p1_salary",
        period_index=1,
        module_step=3,
        module_step_count=5,
        gate="action_salary",
        title="Зарплата не приходит сама",
        body=(
            "Ещё одна штука: зарплату забираешь **ты** — кнопкой **«Зарплата»** внизу. "
            "Я тоже забываю, честно. Не успел до **«Завершить ход»** — за этот ход не повторится.\n\n"
            "**Сейчас: нажми «Зарплата»** в блоке действий."
        ),
    ),
    GuidanceBeat(
        id="p1_cushion",
        period_index=1,
        module_step=4,
        module_step_count=5,
        gate="action_cushion",
        title="Запас на чёрный день",
        body=(
            "**«Пополнить»** — это **подушка**: не траты, а копилка на форс-мажор. "
            "Хоть немного, если на счёте есть свободное — привыкнешь откладывать.\n\n"
            "**Сейчас: нажми «Пополнить»** (подушку)."
        ),
    ),
    GuidanceBeat(
        id="p1_close",
        period_index=1,
        module_step=5,
        module_step_count=5,
        gate="action_close",
        title="Завершаем ход",
        body=(
            "Интересно, а что если не завершить? Расходы всё равно **спишутся**, когда нажмёшь "
            "**«Завершить ход»** в шапке — жизнь, обязательства, содержание. "
            "Даже если баланс в течение хода был в плюсе.\n\n"
            "**Сейчас: нажми «Завершить ход»**, когда будешь готов."
        ),
        debrief_body=(
            "Вот что **реально списалось** в этом ходе — сравни с тем, что видел на чипе «Расходы» "
            "до завершения. Так проще понять, куда ушли деньги.\n\n"
            "**Нажми «Понятно»** — откроется следующий ход."
        ),
    ),
    GuidanceBeat(
        id="p2_new_month",
        period_index=2,
        module_step=1,
        module_step_count=1,
        gate="read",
        title="Новый ход — новый цикл",
        body=(
            "**Ход №2**! **«Зарплата»** снова активна — забери, пока не завершил ход. "
            "Помни: после **«Завершить ход»** зарплата за этот ход уже **не повторится**.\n\n"
            "**Нажми «Понятно»** — дальше подсказки будут появляться, когда зайдёшь в новые разделы."
        ),
    ),
)

BEAT_BY_ID = {b.id: b for b in CURRICULUM}
SPINE_BEAT_IDS = frozenset(b.id for b in CURRICULUM)


def beats_for_period(period_index: int) -> list[GuidanceBeat]:
    pi = max(1, min(2, int(period_index or 1)))
    return [b for b in CURRICULUM if b.period_index == pi]


def all_beat_ids() -> frozenset[str]:
    return frozenset(BEAT_BY_ID.keys())
