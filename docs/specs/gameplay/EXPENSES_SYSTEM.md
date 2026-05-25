---
layer: spec
domain: gameplay
status: draft
owner: product
last_reviewed: 2026-05-19
related:
  - ../features/SPEC_expenses.md
  - ../../vision/ideas/expenses-mechanic.md
  - ../../foundation/SPEC_PRODUCT.md
---

# Система расходов (жизнеобеспечение)

Живой **дизайн-документ** для слоя «Расходы»: что это в продукте, как связано с долгами/активами, как считается burn rate, как влияет на период, API, UI, события, победу и Plan Mode.

**Инвариант:** расходы на жизнь — **не** долг (нет тела кредита) и **не** обслуживание актива (нет `FinanceAsset`). Ипотека — **обязательство**; аренда без долга — **статья расходов `housing`**.

---

## 1. Определения

| Термин | Определение |
|--------|-------------|
| **Расходы (жизнеобеспечение)** | Регулярные месячные траты на поддержание жизни без привязки к телу кредита или конкретному активу |
| **Статья (expense line)** | Одна строка бюджета: категория + сумма/мес + метаданные |
| **Категория** | Классификатор из каталога (`food`, `housing`, …) |
| **Burn rate** | Σ активных статей за период |
| **Обязательная статья** | Must-pay: не отключается игроком в Game v1 |
| **Гибкая статья** | Discretionary: может снижаться событиями / в Plan |
| **monthly_reference_expense** | Obligations + burn (достижения, «месяцы подушки») |

---

## 2. Границы с другими механиками

```text
Доходы          → зарплата (кнопка), доход активов, купоны, события +cash
Обязательства   → платежи FinanceLiability (+ просрочка)
Активы          → покупка, maintenance, income
Страховки       → премии
Инвестиции      → взнос, капитализация
Расходы (E1)    → burn жизнеобеспечения (категории)
События         → разовый cash + изменение статей / burn
```

**Правило шаблона:** blueprint не должен одновременно задавать ипотеку **и** полную аренду в расходах без смысла. Контент-чеклист в [`SPEC_expenses.md`](../features/SPEC_expenses.md) § Content.

---

## 3. Каталог категорий (v1)

| `category_key` | UI (RU) | Типичное содержание |
|----------------|---------|---------------------|
| `housing` | Жильё | Аренда, ЖКУ (если не в liability) |
| `food` | Еда | Продукты, питание вне дома (базово) |
| `transport` | Транспорт | Проезд, бензин (не КАСКО) |
| `health` | Здоровье | Медицина, аптека (не страховка) |
| `clothing` | Одежда и быт | Одежда, химия, мелкий быт |
| `communications` | Связь и подписки | Мобильная, интернет, стриминги |
| `leisure` | Досуг | Развлечения, хобби |
| `other` | Прочее | Не попало в классы |

Каталог в БД (`expense_category_definitions`) или сиды Python — **единый** для Game и Plan.

---

## 4. Модель данных (целевая)

### 4.1 `expense_category_definitions`

Справочник: `category_key`, `title`, `sort_order`, `default_tier` (`must` \| `discretionary`), `icon_key` (для UI).

### 4.2 `profile_expense_lines`

| Поле | Назначение |
|------|------------|
| `game_profile_id` | FK |
| `category_key` | FK на каталог |
| `amount_monthly` | ≥ 0 (или разрешить отрицательные «кредиты»? **нет в v1**) |
| `title_override` | Опционально («Аренда однушки») |
| `source_kind` | `template` \| `event` \| `player` \| `system` |
| `source_ref` | template_key / event_key / null |
| `tier` | `must` \| `discretionary` |
| `created_period_index` | |
| `expires_period_index` | NULL = бессрочно |
| `revoked_at` | |
| `is_active` | |

**Итог:**

```text
monthly_burn_total = sum(active lines.amount_monthly)
```

### 4.3 Legacy (переходный период)

| Legacy | Преемник |
|--------|----------|
| `base_monthly_lifestyle_expense` | Σ строк `source_kind=template` при старте |
| `delta_monthly_lifestyle_expense` | Σ event lines **или** одна строка `other` (миграция) |
| `monthly_lifestyle_expense` в API | Алиас `monthly_burn_total` |

---

## 5. Жизненный цикл

### 5.1 Старт партии (Game)

1. Читать `expense_budget` из blueprint (или разложить legacy `base_monthly_lifestyle_expense` по дефолтным долям шаблона).
2. Создать `profile_expense_lines` для каждой категории с `source_kind=template`.
3. Записать `starter_params_json.expense_budget_snapshot` (неизменяемый снимок для Plan-префилла).

### 5.2 Внутри периода

- Игрок **видит** burn total и (на экране «Расходы») статьи.
- События добавляют/меняют/отзывают строки.
- **Не** списывают burn до конца периода (кроме разовых `cash_delta` в событиях).

### 5.3 Конец периода

1. `burn = compute_monthly_burn(profile)`.
2. Если `burn > 0` → транзакция(и): одна суммарная `LIFESTYLE_EXPENSE` **или** по категориям (продукт: **одна проводка + breakdown** в ответе period end).
3. Деактивировать строки с истёкшим сроком.
4. Записать в `PeriodEconomyClosing` / breakdown: массив по категориям.

### 5.4 Нехватка cash

**Утверждено (2026-05-19):** как обслуживание активов — списание burn допускает **отрицательный cash**; педагогика через поражение за 3 периода в минусе.

**Backlog:** `unpaid_living_expense` + штрафы / частичная оплата.

### 5.5 Шаблон «новичка» и жильё

**Утверждено:** в базовом шаблоне — **минимальный `housing`**; на шаблонах выше сложности доля `housing` и общий burn растут (контент-таблица в сидах E1-114).

### 5.6 UX Game (утверждено)

| Место | Содержание |
|-------|------------|
| **Дашборд** | Одна цифра **burn** (плитка «Расходы»), пояснение про списание в конце периода |
| **Финансы** | Блок «Расходы»: **3–5 топ-категорий** по сумме + переход к полному списку / деталям |
| **Аналитика** | Доля burn в доходе, тренд (волна C) |

---

## 6. Формулы в overview

| Поле | Формула |
|------|---------|
| `monthly_burn_total` | Σ expense lines |
| `monthly_lifestyle_expense` | alias |
| `total_monthly_obligations` | долги + maintenance (без изменений) |
| `total_monthly_outflow` | obligations + burn |
| `net_monthly_cashflow` | income − obligations (**без** burn) |
| `expense_to_income_ratio` | burn / salary (victory) |
| `monthly_reference_expense` | obligations + burn |

**UX-правило:** на дашборде явно подписать: «Чистый поток — до расходов на жизнь; в конце периода спишется ещё N ₽».

---

## 7. События (effects)

| Эффект | Поведение |
|--------|-----------|
| `monthly_lifestyle_delta` (legacy) | +amount к строке `other` или виртуальной дельте до cutover |
| `monthly_expense_delta` | +amount к total (как legacy) |
| `expense_line` (v2) | `{ category_key, amount, title?, tier?, expires_after_periods? }` |
| `expense_line_delta` | изменить существующую строку по `source_ref` |

Clamp: суммарное изменение burn за один choose ≤ `EVENT_LIFESTYLE_DELTA_ABS_CAP` (или отдельная константа).

---

## 8. Game vs Plan

| | Game Mode | Plan Mode |
|---|-----------|-----------|
| Создание статей | Шаблон + события | Игрок + префилл |
| Редактирование | Нет (v1) | Да |
| UI | Сводка + детали | Редактор бюджета |
| Победа | Цели из шаблона с burn | TBD |

---

## 9. История

2026-05-19: черновик после idea-refine; заменяет узкое толкование «lifestyle = одно поле».
