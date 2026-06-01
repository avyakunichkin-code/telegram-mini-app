---
layer: vision
status: approved
last_reviewed: 2026-06-01
audience: product, design, engineering
idea_refine: true
epic_id: DL1
---

# DL1 — Граф «актив ↔ долг ↔ страховка»

## Problem Statement

Сейчас экономика капитала допускает нереалистичные стратегии:

1. **Ипотека / кредит** — при оформлении из шаблона весь `principal` зачисляется на **cash** (`liability_disbursement`). Игрок может взять несколько ипотек и купить на эти деньги что угодно.
2. **Платёж по долгу** — списывается только **процент** на тело (`monthly_interest_payment`); `total_debt` от периодических платежей **не уменьшается** ([`SPEC_PRODUCT.md`](../../foundation/SPEC_PRODUCT.md) §12.1).
3. **Срок кредита** — в шаблонах/идеях может фигурировать, но в `finance_liabilities` **нет** `term_periods` / остатка срока.
4. **Страховка** — продукт × объект (`auto_property`, `mortgage_life`, …) есть ([`insurance-product-parameters.md`](insurance-product-parameters.md)), но полис **не привязан** к конкретному `finance_assets.id`. При двух машинах непонятно, что застраховано; можно оформить КАСКО **без** авто в портфеле.
5. **Погашение** — только полное закрытие (`delete_liability` с телом + просрочкой); **частичного** досрочного нет.

Это бьёт по доверию продвинутых игроков (roadmap: «честность долга», GD-16 / GD-18) и мешает событиям вида «нет страховки + есть авто» (GD-11).

## Recommended Direction

**Два пути владения** (утверждено 2026-06-01, [ADR-010](../../decisions/ADR-010-liability-asset-insurance-graph.md)):

| Путь | Суть |
|------|------|
| **A — secured** | Актив + ипотека/автокредит **одной операцией**; principal **не** на cash; взнос с cash |
| **B — cash** | До **2** потребительских кредитов на cash → покупка квартиры/машины **за свои** |

**Продажа:** если у актива есть secured-долг — из выручки сначала гасится кредит (просрочка + тело), на cash только **остаток**; при нехватке выручки — доплата с cash.

| Сущность | Связь | Правило |
|----------|--------|---------|
| `FinanceAsset` | `acquisition_mode` | `secured` \| `cash` |
| `FinanceLiability` | `secured_asset_id`, `liability_kind` | Secured 1:1 с активом; consumer без FK |
| `InsurancePolicy` | `insured_asset_id` | Покупка только при наличии актива; при продаже актива — деактивация полиса |

**Платежи:** аннуитет (или явный режим в шаблоне) — каждый период часть платежа **уменьшает тело**, срок **истекает** → долг закрывается.

**Досрочно:** отдельное действие «Частичное погашение» (сумма ≤ cash, ≤ остаток тела) без удаления записи.

**Страховка:** срок 12 периодов уже заложен в модели (`term_periods`, `expires_period_index`, `expire_policies_for_period`); эпик доводит **UX, валидацию при покупке и события**, а не изобретает срок с нуля.

## MVP Scope (эпик DL1, до Pre-Alpha)

Волнами, см. [`PLAN_debt-liability-capital-graph.md`](../../plans/PLAN_debt-liability-capital-graph.md):

1. **Модель + ADR** — поля, типы долгов, миграция, legacy.
2. **Целевое кредитование** — ипотека/автокредит только с активом; анти-эксплойт «деньги на всё».
3. **Страховка ↔ актив** — FK, проверки при `buy`, отображение в UI.
4. **Срок + аннуитет** — `term_periods`, график, автозакрытие.
5. **Частичное погашение** — API + UI.
6. **Полировка страховки** — остаток срока, продление (опционально v1.1).

## Not Doing (в рамках DL1)

- Полный банковский сим (КАСКО с франшизой, рефинанс, кредитный рейтинг) — см. [`insurance-product-parameters.md`](insurance-product-parameters.md) Not Doing.
- Налоги, залоговая стоимость ≠ рыночной, несколько кредиторов на один актив.
- Plan Mode — отдельный эпик; DL1 только **Game** + обратная совместимость активных сохранений.
- Пересчёт всех `victory_config` — отдельный balance-playtest после волны D.

## Product decisions (closed)

| # | Решение | Артефакт |
|---|---------|----------|
| 1 | **Два пути:** secured bundle **или** cash + до 2 consumer-кредитов | ADR-010 §1–4, SPEC §5.1–5.2 |
| 2 | **Продажа с ипотекой:** выручка → payoff долга → остаток на cash; при недостатке — доплата с cash | ADR-010 §2, SPEC §5.3 |

## Open Questions

| # | Вопрос | Куда решать |
|---|--------|-------------|
| 3 | Legacy полисы без `insured_asset_id` — grandfather или миграция по `kind`? | Миграция |
| 4 | Аннуитет vs дифференцированный — только аннуитет в v1? | SPEC §4.1 |

## Traceability

| Артефакт | Путь |
|----------|------|
| ADR | [`ADR-010-liability-asset-insurance-graph.md`](../../decisions/ADR-010-liability-asset-insurance-graph.md) |
| Spec | [`SPEC_debt-liability-capital-graph.md`](../../specs/features/SPEC_debt-liability-capital-graph.md) |
| Plan | [`PLAN_debt-liability-capital-graph.md`](../../plans/PLAN_debt-liability-capital-graph.md) |
| Tasks | [`TASKS_debt-liability-capital-graph.md`](../../tasks/TASKS_debt-liability-capital-graph.md) |
| Roadmap | GD-16, GD-18 → DL1 в [`GAME_DESIGN_ROADMAP_2026.md`](../GAME_DESIGN_ROADMAP_2026.md) |
