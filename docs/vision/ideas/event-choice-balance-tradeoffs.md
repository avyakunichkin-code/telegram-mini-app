---
layer: idea
status: approved-direction
last_reviewed: 2026-05-30
idea_refine: true
spec: ../../specs/features/SPEC_event-system-v2-slots-and-taxonomy.md
skills: .cursor/skills/create-event/event-balance-rules.md
---

# Баланс выборов в событиях — «нет бесплатных плюсов»

## Problem Statement (HMW)

**Как сделать так, чтобы в каждом событии ни один вариант не был очевидно «лучшим по всем осям», а игрок учился trade-off — деньги ↔ потребности ↔ burn — как в реальной жизни?**

---

## Recommended Direction

1. **Закон trade-off (продукт):** рост потребностей **не бывает бесплатным**. Компенсация — `cash_delta` &lt; 0, рост burn (`monthly_burn_delta_pct`, `expense_line`), штраф на **другой** оси needs в том же выборе, или явное исключение в brief.

2. **Закон отказа:** «Не тратить деньги» в soft_offer **почти всегда** имеет цену — падение needs, упущенная возможность (social/status), редко — только нейтральный 0/0 с копирайтом «ничего не изменилось».

3. **Needs risk / просадка &lt; 33%:** событие — **риск или последствие**, не подарок. Платное смягчение допустимо; вариант «поднять needs без затрат» — **запрещён** (или только с сильным narrative-cost в brief).

4. **Операционно:** чеклист в [`event-balance-rules.md`](../../../.cursor/skills/create-event/event-balance-rules.md) (§1–4 trade-off, §10 lifecycle, §11 оси needs, §12 MCE); аудит — `/event-analysis` + `/balance-playtest` после массовых правок.

5. **Повтор и «лестница»:** не бесконечный downgrade/переезд — [`event-repeat-and-state-ladder.md`](event-repeat-and-state-ladder.md).

6. **Lint:** `backend/app/events/balance_contract.py` + pytest baseline (31 нарушения до EVT1-105 → 0).

---

## Key Assumptions to Validate

- [ ] Игроки **видят** impacts (cash, needs, burn) до выбора — иначе trade-off не работает pedagogically.
- [ ] «Жёсткий» отказ (needs −5…−15) не отталкивает сильнее, чем «бесплатный плюс» ломает экономику — playtest α.
- [ ] Для tier-1 soft_offer допустим **мягкий** отказ (−2…−4 на одной оси), не обязательно −10.
- [ ] Исключения (intro, informational, insured payout) — **&lt;5%** каталога и с пометкой в brief.

---

## MVP Scope

- Правила в skills + spec v2; ревизия **новых** событий и **топ-10** старых с доминирующими «плюсиками» (EVT1 content slice).
- Матрица «доминирование» в event-analysis отчёте (ручной + rg по YAML).
- needs_risk YAML — только с платным или «тяжёлым» исходом.

---

## Not Doing (and Why)

- **Жёсткий solver** «автоподбор cash под needs» — дорого, позже.
- **Автолинт** — `validate_mvp11_balance` в pytest; baseline нарушений до ребаланса EVT1-105.
- **`xp_delta` в каталоге** — запрещён (ADR-003); не использовать как «цену» выбора.
- **Одинаковый trade-off для студента и про** — суммы разные, **закон** один.

---

## Open Questions

- Минимальная «цена» needs+ за 10 пунктов одной оси: % salary? (ориентир 3–8% tier-1)
- Обязателен ли **второй** «средний» выбор между «дорого+много needs» и «отказ»?

---

## Связь

| Документ | Роль |
|----------|------|
| [`event-balance-rules.md`](../../.cursor/skills/create-event/event-balance-rules.md) | чеклист агента §1–12 |
| [`EVENT_BRIEF.md`](../../templates/EVENT_BRIEF.md) | lifecycle_class → YAML |
| [`EVENTS_AGENT.md`](../../agents/EVENTS_AGENT.md) | конвейер create / analysis |
| [`SPEC_event-system-v2-slots-and-taxonomy.md`](../../specs/features/SPEC_event-system-v2-slots-and-taxonomy.md) | § Balance |
| [`game-balance-thresholds-and-constraints.md`](game-balance-thresholds-and-constraints.md) | макро-экономика партии |

---

## История

| Дата | Событие |
|------|---------|
| 2026-05-30 | idea-refine + продуктовое решение команды |
