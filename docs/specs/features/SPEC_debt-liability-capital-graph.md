---
layer: spec
status: draft
epic_id: DL1
last_reviewed: 2026-06-01
idea: ../../vision/ideas/debt-liability-capital-graph.md
plan: ../../plans/PLAN_debt-liability-capital-graph.md
traceability: ../../TRACEABILITY.md
---

# SPEC: DL1 — Реалистичный долг и граф капитала

**Статус:** `draft` — реализация **после** утверждения плана и ADR; **до** волны Pre-Alpha PA-W2 (не блокирует PA-W1, но повышает доверие к «Капиталу»).

**Связано:** [`SPEC_PRODUCT.md`](../../foundation/SPEC_PRODUCT.md) §12.1, [`insurance-product-parameters.md`](../../vision/ideas/insurance-product-parameters.md), [`finance.md`](../../ux/screens/finance.md).

**Нормативные решения по потокам:** [`ADR-010`](../../decisions/ADR-010-liability-asset-insurance-graph.md) (**accepted** 2026-06-01).

---

## 1. Цели

1. Исключить эксплойт «взял ипотеку → купил всё на cash».
2. Сделать платежи по кредиту **понятными**: тело уменьшается, срок конечен.
3. Привязать страховку имущества/авто к **конкретному** активу игрока.
4. Дать **частичное досрочное** погашение без закрытия всего обязательства.

## 2. Текущее состояние (as-is)

| Область | Поведение |
|---------|-----------|
| Выдача кредита | `create_liability_from_template` → `adjust_balance(+principal)` |
| Платёж | `monthly_interest_payment` — только %; тело неизменно |
| Закрытие | `DELETE /liabilities/{id}` — полное погашение cash |
| Страховка | `product` + `insured_object` (строки); срок есть, истечение в `charge_premiums_for_period` |
| Актив | `FinanceAsset.kind` (`home`, `car`, …); связи с долгом нет |
| Продажа актива | `delete_asset` → **вся** `asset_value` на cash; долг не трогается |

## 3. Модель данных (to-be)

### 3.1. `finance_liabilities` (расширение)

| Поле | Тип | Описание |
|------|-----|----------|
| `liability_kind` | `enum` string | `unsecured` \| `consumer` \| `mortgage` \| `auto_loan` — см. [ADR-010](../../decisions/ADR-010-liability-asset-insurance-graph.md) §1 |
| `acquisition_mode` | string, on asset (optional) | `secured` \| `cash` — как куплен актив (для UI и событий) |
| `secured_asset_id` | FK → `finance_assets.id`, nullable | Обязателен для `mortgage` / `auto_loan` |
| `term_periods` | int | Срок в периодах (например 240 ипотека, 60 авто) |
| `periods_paid` | int, default 0 | Число периодов с **полной** уплатой графика (просрочка не уменьшает `n`) |
| `original_principal` | float | Сумма на выдаче (для истории / аналитики) |
| `payment_mode` | string | `annuity` (default) \| `interest_only` (legacy flag для старых шаблонов) |

**Legacy:** строки без `liability_kind` → `unsecured`, `payment_mode=interest_only`, поведение как сейчас до миграции игроком/волной.

### 3.2. `liability_templates` (расширение)

| Поле | Описание |
|------|----------|
| `liability_kind` | Тип продукта |
| `term_periods` | Срок по умолчанию |
| `requires_asset_kind` | `home` / `car` / null |
| `disbursement_mode` | `to_asset_purchase` \| `to_cash` (потребительский кредит) |
| `linked_asset_template_key` | опционально — парный шаблон актива |

### 3.3. `insurance_policies` (расширение)

| Поле | Описание |
|------|----------|
| `insured_asset_id` | FK → `finance_assets.id`, nullable для `health_life` и legacy |

### 3.4. Инварианты

- `mortgage` / `auto_loan`: `secured_asset_id` NOT NULL, актив `is_active=1`, `kind` совпадает с продуктом.
- Нельзя активировать второй **целевой** кредит на тот же актив (1:1).
- Одновременно не более **2** активных `consumer` / `unsecured` на профиль (ADR-010 §4).
- `buy` страховки с `insured_object in (property, liability)` для авто/имущества: `insured_asset_id` обязателен; актив должен существовать.
- При `period_index >= expires_period_index` полис не списывает премию и `is_active=0` (уже в коде — зафиксировать в тестах).

## 4. Формулы

### 4.0. Канон полей (математика ledger)

| Поле | Смысл | Не включает |
|------|--------|-------------|
| `total_debt` | Остаток **основного долга** \(P\) | Начисленные, но не капитализированные проценты |
| `overdue_amount` | Накопленная **недоплата** по графику (проценты + тело в составе неуплаченного платежа) | — |
| `monthly_payment` | Плановый платёж **текущего** графика (фиксируется при выдаче и после prepay) | — |
| `original_principal` | \(P_0\) на выдаче | Не уменьшается при амортизации |
| `asset_value` | Полная цена/оценка актива (путь A: = `purchase_price`) | Не «доля без ипотеки» |

**Payoff** (продажа актива, полное закрытие, DL1-AC-1c):

```text
payoff = overdue_amount + total_debt
cash_from_sale = max(0, asset_value - payoff)
cash_top_up    = max(0, payoff - asset_value)   // списать с cash при продаже
```

**Путь A:** `purchase_price = asset_value`, `original_principal = purchase_price - down_payment`, `down_payment + original_principal = purchase_price`.

Ревью: [`DL1_MATH_CONSISTENCY_REVIEW.md`](../economy/DL1_MATH_CONSISTENCY_REVIEW.md).

### 4.1. Аннуитет (режим по умолчанию)

Пусть `P` = `total_debt`, `r` — месячная ставка (`annual_rate_percent / 100 / 12`), `n` = `term_periods - periods_paid` (оставшиеся периоды).

```
payment = P * r * (1+r)^n / ((1+r)^n - 1)   при r > 0
payment = P / n                              при r = 0
```

При **выдаче** и **после prepay:** один раз вычислить `monthly_payment` из текущих \((P, r, n)\) и сохранить в поле до следующего prepay.

**Закрытие периода** (`process_period_end`), если `paid >= monthly_payment + overdue_amount` (полная уплата):

- `interest_part = P * r`
- `principal_part = monthly_payment - interest_part` (в последнем периоде: `min(principal_part, P)`)
- `P := P - principal_part` → записать в `total_debt`
- `periods_paid += 1`

Если `paid <` полной суммы: весь недоплаток → `overdue_amount`, **`total_debt` без изменений**.

**Округление:** копейки HALF_UP на каждый компонент; последний период — остаток тела в `principal_part`.

### 4.2. Interest-only (legacy)

Текущая `monthly_interest_payment` — только если `payment_mode=interest_only` **и** нет `term_periods` (или явный флаг шаблона «обучающий кредит»).

### 4.3. Частичное погашение

`POST /api/finance/liabilities/{id}/prepay` body: `{ "amount": number }`

- `amount > 0`, `amount <= cash`.
- **Waterfall:** (1) погасить `overdue_amount` до нуля, (2) остаток уменьшить `total_debt` (не больше текущего \(P\)).
- Пересчитать `monthly_payment` из \((P_\text{new}, r, n_\text{rem})\), где `n_rem = term_periods - periods_paid`.

### 4.4. Golden vectors (pytest)

Округление: **HALF_UP до 0.01** на каждом шаге. Канон в коде: `backend/app/finance/annuity.py`, константы: `backend/tests/fixtures/dl1_golden_vectors.py`, тесты: `backend/tests/test_dl1_annuity_golden.py`.

**V1 — выдача, 2 полных периода, prepay 50 000 ₽** (\(P_0=1\,000\,000\), 12% год., \(n=12\)):

| Шаг | `total_debt` | `monthly_payment` | interest | principal | прочее |
|-----|--------------|-------------------|----------|-----------|--------|
| Выдача | 1 000 000.00 | 88 848.79 | — | — | |
| Период 1 (полная оплата) | 921 151.21 | 88 848.79 | 10 000.00 | 78 848.79 | `periods_paid=1` |
| Период 2 (полная оплата) | 841 513.93 | 88 848.79 | 9 211.51 | 79 637.28 | `periods_paid=2` |
| Prepay 50 000 | 791 513.93 | **83 569.68** | — | — | `n_rem=10` |

**V2 — продажа после V1** (`overdue=5 000`, `asset_value=1 100 000`): `payoff=796 513.93`, `cash_net=303 486.07`, `top_up=0`.

**V3 — частичная оплата** (после V1 prepay): due `83 569.68`, paid `40 000` → `overdue=43 569.68`, **`total_debt` без изменений** `791 513.93`.

**V4 — prepay 100 000 при overdue V3:** сначала `43 569.68` в overdue, затем `56 430.32` в тело → `total_debt=735 083.61`, `overdue=0`.

**V5 — underwater sale:** `asset_value=700 000`, `total_debt=791 513.93` → `top_up=91 513.93`, `cash_net=0`.

## 5. Потоки API / UX

Источник решений: [ADR-010](../../decisions/ADR-010-liability-asset-insurance-graph.md).

### 5.1. Путь A — актив + целевой кредит (secured)

**Один атомарный сценарий** (рекомендуемый endpoint, имя уточнить при реализации):

`POST /api/finance/acquisitions/secured` (или расширение `from-template` с `mode=secured_bundle`)

**Вход:** `liability_template_key`, `asset_template_key` (или bundled `bundle_key`), опционально `down_payment` из шаблона.

**Эффект в одной транзакции:**

| Шаг | Действие |
|-----|----------|
| 1 | Проверка: нет второго secured на будущий актив; cash ≥ down_payment |
| 2 | `cash -= down_payment` (транзакция `asset_down_payment`) |
| 3 | Создать `FinanceAsset` (`acquisition_mode=secured`) |
| 4 | Создать `FinanceLiability` (`mortgage` / `auto_loan`, `secured_asset_id`, `original_principal` = цена − down_payment) |
| 5 | **Не** создавать `liability_disbursement` на полный principal |

**Запрещено:** `disbursement_mode=to_cash` для шаблонов `mortgage` / `auto_loan`.

### 5.2. Путь B — покупка за cash (+ опционально потребительские кредиты)

**B1. Потребительский кредит** — `POST /liabilities/from-template` с `disbursement_mode=to_cash`:

- `liability_kind` = `consumer` или `unsecured`
- `secured_asset_id` = NULL
- `adjust_balance(+principal)` — как сейчас
- Не более **2** активных consumer/unsecured на профиль

**B2. Покупка актива за cash** — `POST /assets/from-template`:

- `cash -= asset_price` (транзакция `asset_purchase`)
- `FinanceAsset` с `acquisition_mode=cash`, **без** secured-долга
- Допускается при уже открытых 1–2 потребительских кредитах, если хватает cash

### 5.3. Продажа актива

`DELETE /assets/{id}` или `POST /assets/{id}/sell` (канонизировать при реализации).

| Условие | Поведение |
|---------|-----------|
| Нет активного secured на активе | `cash += asset_value` (как as-is) |
| Есть secured (`secured_asset_id`) | `payoff = overdue_amount + total_debt` (§4.0); проценты только внутри `overdue`, не в `total_debt` |
| | `from_sale = asset_value`; если `from_sale < payoff`, требовать `cash >= payoff - from_sale` |
| | `cash += max(0, from_sale - payoff)`; закрыть долг; деактивировать полисы на активе |
| | Транзакции: `liability_payoff_from_sale`, `asset_sale` (net) |

**UI:** превью перед подтверждением: «Погашение кредита … ₽ · На счёт … ₽ · Доплата с счёта … ₽».

### 5.4. Страховка

- Каталог: для продуктов «на объект» API возвращает список **подходящих активов** игрока.
- UI: выбор актива → `insured_asset_id` в `POST /insurance/buy`.
- Ошибка 400, если активов нужного типа нет («Сначала оформите автомобиль»).

### 5.5. Отображение

- Долг: остаток тела, платёж, **осталось периодов**, привязанный актив (название).
- Полис: объект (название актива), **до периода N** / «истекает через k периодов».

## 6. Игровой цикл (`process_period_end`)

Порядок (уточнить в ADR, не ломая текущий breakdown):

1. `expire_policies_for_period`
2. Платежи по долгам (аннуитет / legacy)
3. Автозакрытие долга при `total_debt <= epsilon` или `periods_paid >= term_periods`
4. Премии страховок (только неистёкшие)

## 7. События и победа

- Предикаты: `has_insured_asset(kind=car)`, `liability_on_asset(asset_id)` — для EVT1 / GD-11.
- Victory / achievements: пересмотр целей с «нет просрочки» — без изменения в DL1 v1, только регрессионный balance-playtest.

## 8. Миграции

- SQL в `backend/migrations/` + автодобавление в `main.py` по принятому в проекте паттерну.
- Backfill: существующие liabilities → `unsecured`, `interest_only`; policies → `insured_asset_id` NULL (события по `kind` как сейчас).

## 9. Acceptance criteria (эпик)

| ID | Критерий |
|----|----------|
| DL1-AC-1 | Secured: principal не на cash; bundle актив+долг; consumer: ≤2 активных, выдача на cash |
| DL1-AC-1b | Покупка актива за cash при достаточном остатке на счёте |
| DL1-AC-1c | Продажа с ипотекой: сначала payoff долга, на cash только остаток; доплата при недостатке выручки |
| DL1-AC-2 | Аннуитетный платёж уменьшает `total_debt` каждый закрытый период |
| DL1-AC-3 | По истечении `term_periods` долг закрыт (`is_active=0` или удалён по правилу ADR) |
| DL1-AC-4 | Частичное погашение уменьшает тело и пересчитывает платёж |
| DL1-AC-5 | Нельзя купить КАСКО без `car` в активах |
| DL1-AC-6 | Полис с истёкшим `expires_period_index` не списывает премию |
| DL1-AC-7 | pytest: `test_liability_annuity.py`, `test_insurance_asset_binding.py`, регрессия `test_period_close_metrics.py` |

## 10. Вне scope

См. idea §Not Doing.

---

## 11. Test gate (обязательно с кодом)

**Правило эпика:** ни один PR волны A–F **не мержится** без зелёного pytest по матрице ниже. Satellites: `test-driven-development`, `critical-test-scenarios`.

### 11.1. Матрица файлов

| Файл | Покрывает | DL1-AC |
|------|-----------|--------|
| `tests/test_dl1_annuity_golden.py` | §4.1–4.3, §4.4 V1–V5 | 2, 4 |
| `tests/test_liability_legacy_compat.py` | backfill, interest-only | legacy |
| `tests/test_secured_acquisition.py` | путь A, нет disbursement на cash | 1, 1b |
| `tests/test_consumer_loan_limit.py` | ≤2 consumer | 1 |
| `tests/test_asset_sale_with_mortgage.py` | продажа payoff / top-up | 1c |
| `tests/test_liability_prepay.py` | API prepay + waterfall | 4 |
| `tests/test_insurance_asset_binding.py` | buy без актива / FK | 5 |
| `tests/test_insurance_policy_expiry.py` | премия после expires | 6 |
| `tests/test_period_close_metrics.py` | регрессия period_end + аннуитет | 2, 3, 7 |

### 11.2. Критические сценарии (CS)

| ID | Сценарий | Тип |
|----|----------|-----|
| CS-DL1-01 | V1 golden: 2 периода + prepay → платёж 83 569.68 | unit |
| CS-DL1-02 | V3 partial: тело не меняется | unit |
| CS-DL1-03 | V5 underwater: top-up 91 513.93 | unit |
| CS-DL1-04 | Secured bundle: cash ↑ только −down_payment | integration |
| CS-DL1-05 | 3-я ипотека на тот же дом → 400 | integration |
| CS-DL1-06 | КАСКО без `car` → 400 | integration |
| CS-DL1-07 | `period_end`: полная оплата → `total_debt` ↓ | integration |
| CS-DL1-08 | `period_end`: `periods_paid == term` → долг закрыт | integration |

### 11.3. DoD волны

| Волна | Минимум тестов перед merge |
|-------|----------------------------|
| A | `test_dl1_annuity_golden` + `test_liability_legacy_compat` |
| B | + `test_secured_acquisition`, `test_consumer_loan_limit` |
| C | + `test_insurance_asset_binding` |
| D | + `test_period_close_metrics` (annuity branch) |
| E | + `test_liability_prepay` |
| F | + `test_asset_sale_with_mortgage`, `test_insurance_policy_expiry` |

**Balance:** после волны D — `balance-playtest` отчёт в `docs/balance/reports/` (не заменяет pytest).

---

## История

| Дата | Изменение |
|------|-----------|
| 2026-06-01 | Черновик spec под эпик DL1 |
| 2026-06-01 | Потоки A/B и продажа — по ADR-010 (product decision) |
| 2026-06-01 | §4.0 канон полей, аннуитет/prepay/payoff — math review |
| 2026-06-01 | §4.4 golden vectors; §11 test gate; `finance/annuity.py` + `test_dl1_annuity_golden` |
