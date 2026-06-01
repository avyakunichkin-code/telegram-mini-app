---
layer: idea
status: approved
owner: product
last_reviewed: 2026-05-22
tracks: events, gameplay, chains
---

# Каталог событий: Q&A и цепочки

## Problem Statement

**How might we** сделать каждый выбор в событии честным по деньгам (метрики = реальный эффект), а отложенные решения — **гарантированным продолжением через N периодов**, а не пустым кликом?

## Recommended Direction

1. **Типы сценариев:** A мягкий оффер (отказ 0 ₽) · B обязательное последствие · C цепочка · D привязка к активу · E разовый сюжет.
2. **Цепочки (MVP):** таблица `event_profile_chains`, effect `enqueue_event` с `after_periods` в данных; due-событие не попадает в случайный пул.
3. **Подержанное авто (канон):**
   - Задаток **50 000 ₽** сейчас.
   - Цена сделки = цена шаблона × **(1 − 25%)** (выгода 20–30%).
   - Part 2 через **2 периода** (`after_periods: 2` в БД/сидах).
   - Выкуп: доплата `deal_price − deposit` + актив `car_personal`; отказ после задатка — задаток не возвращается.

## Key Assumptions to Validate

- [ ] Игроку понятно на кнопке: счёт сейчас, burn, доплата на part 2 — через `impacts[]`.
- [ ] 2 периода ожидания не ощущаются как «пропало событие» — нужен hint в part 1 («решение через 2 периода»).
- [ ] 25% скидка от `asset_templates.car_personal.asset_value` балансна относительно стартового cash.

## MVP Scope

**In:** `event_profile_chains`, `enqueue_event`, `asset_from_template` (цена сделки), сиды `mq11_used_car_offer` + `mq11_used_car_deadline`, тесты, автомиграция в `main.py`.

**Out (следующие спринты):** informational «лотерея»; UI-таймер цепочки; ветки 3+ шагов; контекстный пул first.

**In (сделано / в коде):** цепочка **родственник**; `EVENT_TAXONOMY` + пул (домены, fatigue); см. [`event-engagement-anti-fatigue.md`](event-engagement-anti-fatigue.md).

## Not Doing (and Why)

- **Универсальный редактор цепочек в админке** — только JSON в сидах.
- **Замороженный задаток отдельной строкой баланса** — пока один cash_delta.
- **Кредит на остаток авто** — только полная доплата с cash.

## Open Questions

- Точный `discount_rate` по другим шаблонам авто — пока 0.25 для `car_personal`.
- Part 2: `mandatory_gate: blocks_period_end` — да, пока включён.

## Согласованные параметры (2026-05-22)

| Параметр | Значение |
|----------|----------|
| Задаток | 50 000 ₽ |
| Скидка | 25% (`discount_rate: 0.25`) |
| `after_periods` | 2 (в `enqueue_event`) |
| Шаблон | `car_personal` |

## Цепочка «родственник» (согласовано 2026-05-22)

| Шаг | Ключ | Условие |
|-----|------|---------|
| Part 1 | `mq11_family_money_request` | Помощь −15k / −7k — **без цепочки** (безвозвратно) |
| Part 1 → 2 | Отказ | `enqueue_event`, `chain_key: family_money_refusal`, **`after_periods: 1`** |
| Part 2 | `mq11_family_money_callback` | Мягкое (`mandatory_gate: none`); суммы **18k / 9k** / твёрдый отказ |
| После 2-го отказа | — | **Без штрафа** в MVP; позже — informational «лотерея» ([`event-types-and-taxonomy.md`](event-types-and-taxonomy.md)) |

Рефинанс (`mq11_refinance_bank`): **не показывать** (`is_active: false`) до реальной механики рефинанса.
