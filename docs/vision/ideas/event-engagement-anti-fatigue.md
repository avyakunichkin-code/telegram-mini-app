---
layer: idea
status: approved
owner: product
last_reviewed: 2026-05-22
tracks: events, gameplay, content-pipeline
---

# Вовлечённость событий: анти-усталость

## Problem Statement

**How might we** удержать интерес к событиям после **10+ периодов**, чтобы игрок не листал карусель и не выбирал всегда «0 ₽», при **~1–3 мин на закрытый период** (опытный) и **2 событиях за период**?

## Recommended Direction

**Пакет A (система пула) + B (короткие цепочки), без C (штрафы за пропуск).**

1. **Ротация доменов** — два слота периода по возможности с разными `event_domain`.
2. **Кулдаун + усталость** — `cooldown_periods` на repeatable; вес def падает после повторных выборов (`effective_weight`).
3. **Контент = много отдельных defs**, не «variant B» в одной записи: тот же домен и механика, **другой key/текст/суммы** — для игрока новая карточка. См. [`event-types-and-taxonomy.md`](event-types-and-taxonomy.md) § «Варианты контента».
4. **Цепочки 1–2 шага** — родственник, авто; «память партии» и informational «лотерея» — позже.
5. **Часть soft_offer** — убрать третий «бесплатный» выбор где уместно (вебинар, курс).
6. **Контекстные события first** — отдельный эпик (prerequisites по состоянию партии).
7. **Монетка one-liner** — пробовать после метрик; не блокер MVP 1.1.
8. **`EVENTS_PER_PERIOD = 2`** — без изменений.

## Key Assumptions to Validate

- [ ] Ротация доменов + кулдауны снижают повтор одного key в 6 периодах.
- [ ] Отдельные defs с тем же доменом ощущаются «новыми» при другом тексте.
- [ ] 12+ defs недостаточно на 20 периодов — нужен **конвейер добавления** (ниже).

## MVP Scope (реализовано / в работе)

**In:**

- `event_taxonomy.py`, `metadata_json` в сидах (`EVENT_TAXONOMY`).
- Цепочка `family_money_refusal` (18k/9k, `after_periods: 1`).
- Ротация доменов и fatigue weight в `ensure_period_events`.
- `cooldown_periods: 3` на базовые **consumption** defs (класс **D** — не путать с **B** housing/downgrade: там ≥ 12, [`event-repeat-and-state-ladder.md`](event-repeat-and-state-ladder.md)).
- Рефинанс `is_active: 0`.
- Урезание выборов: вебинар, вечерний курс (2 кнопки).

**Out:**

- Иконка домена в UI.
- Штраф за пропуск pending.
- Контекстный пул «сначала долг/машина».
- Informational «лотерея».
- 1 событие за период.

## Система добавления событий (конвейер)

Чтобы масштабировать каталог без «уникального сюжета на каждый tier»:

| Шаг | Действие |
|-----|----------|
| 1 | Скопировать **шаблон spec** из `events/mvp11_seeds.py` (key, tier, domain, 2–3 choices, effects). |
| 2 | Новый **уникальный `key`** (`mq11_streaming_offer_b` — новый текст, те же effect-типы). |
| 3 | Строка в **`EVENT_TAXONOMY`** с тем же `event_domain`, при необходимости другой `event_tier`. |
| 4 | `cooldown_periods` ≥ 2 для repeatable **consumption (класс D)**; **жильё/downgrade (класс B)** — ≥ 12, см. [`event-balance-rules.md`](../../.cursor/skills/create-event/event-balance-rules.md) §10 |
| 5 | Идемпотентный сид + при необходимости SQL-миграция для prod БД. |
| 6 | Строка в матрице XP / Q&A doc при нетривиальном балансе. |

**Не делать:** одна запись `EventDefinition` с массивом `variants[]` и общим заголовком — утомляет и ломает аналитику по key.

## Not Doing (and Why)

- **Variant B в одном key** — пользователь предпочёл отдельные defs; проще аналитика и копирайт.
- **Жёсткий блок периода** для всех pending — ломает TMA-сессию.
- **20 defs без системы** — только хаос в весах; сначала конвейер + домены.

## Добавлено (2026-05-22)

Четыре consumption-«двойника» (отдельные key): `mq11_coffee_takeaway`, `mq11_clothing_clearance`, `mq11_food_delivery_promo`, `mq11_appliance_sale` — миграция `0026`.

## Open Questions

- Целевой размер каталога к MVP 1.2 (24? 36 defs)?
- Когда подключать аналитику `event_domain` в `SPEC_ANALYTICS`?
