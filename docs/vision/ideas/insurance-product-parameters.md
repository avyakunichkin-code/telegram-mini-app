# Страховка — параметры продукта (утверждено)

## Problem Statement

Как оформить страховку в ТВОЙ ХОД как узнаваемый страховой продукт (продукт × объект), с понятной экономикой на экране и заделом под события, без лишней сложности реального рынка?

## Recommended Direction

**Полис = продукт + объект + сумма выплаты + оплата за период + срок.**

- `kind` в БД собирается как `{product}_{insured_object}` (например `auto_liability` = ОСАГО).
- Отдельные теги рисков не храним — сценарии задаются парой продукт/объект.
- **Страховой случай (игра):** полная `payout_amount` на счёт, полис закрывается (`claimed_period_index`, `is_active = 0`). Остаток лимита и частичные выплаты не считаем.
- **Срок:** `term_periods`, `started_period_index`, `expires_period_index`; без случая полис гасится по истечении срока.
- **Не в MVP (I1):** франшиза, исключения, co-pay, период лимита.
- **DL1 (эпик):** привязка полиса к `finance_assets.id` — [`ADR-010`](../../decisions/ADR-010-liability-asset-insurance-graph.md) §3.

## Каталог пар (MVP)

| product | insured_object | kind | UI title |
|---------|----------------|------|----------|
| mortgage | life | mortgage_life | Ипотека — страхование жизни |
| mortgage | property | mortgage_property | Ипотека — страхование имущества |
| auto | property | auto_property | КАСКО |
| auto | liability | auto_liability | ОСАГО |
| health | life | health_life | Страхование здоровья (legacy) |
| property | property | property_property | Страхование имущества (legacy) |

Код: `backend/app/starters/insurance_catalog.py`, миграция `backend/migrations/0008_insurance_product_object.sql`.

## MVP Scope (форма UI)

- Выбор **продукта** (один селект: продукт — объект).
- **Сумма выплаты** (`payout_amount`).
- **Оплата за период** (`monthly_premium`).
- **Срок** (`term_periods`).
- Список полисов: название, премия, выплата, срок.

## Not Doing

- `covers_risk_tags`, исключения, франшиза — продукт заменяет риск-слой.
- `limit_period_scope` / остаток лимита — выплата всегда полная, полис сгорает.
- Несколько страховщиков, котировки, индексация.
- Привязка полиса к `finance_assets.id` — перенесено в эпик **DL1** ([ADR-010](../../decisions/ADR-010-liability-asset-insurance-graph.md)).

## Open Questions

- Первое событие с `settle_insurance_claim`: какой `product`/`insured_object` матчить в `effects_json` (отдельная задача events).
