---
layer: spec
status: draft
owner: product
last_reviewed: 2026-05-19
tracks: expenses, economy, e1, life-sustaining-budget
idea: ../../vision/ideas/expenses-mechanic.md
gameplay: ../gameplay/EXPENSES_SYSTEM.md
foundation: ../../foundation/SPEC_PRODUCT.md
related:
  - SPEC_victory-v2.md
  - SPEC_achievements.md
  - SPEC_mvp-11-progression-events.md
  - SPEC_game-plan.md
  - SPEC_ANALYTICS.md
  - SPEC_FRONTEND_UI.md
  - ../../plans/PLAN_expenses.md
  - ../../specs/economy/EXPENSES_LAYER_CHECKLIST.md
---

# Spec: Эпик E1 — Расходы на жизнеобеспечение

Норматив эпика: **полноценный слой бюджета жизни** (еда, жильё, одежда, связь, здоровье, досуг…), а не только отображение агрегата `base + delta`.

Канон механики: [`EXPENSES_SYSTEM.md`](../gameplay/EXPENSES_SYSTEM.md).  
Чеклист «ничего не забыть»: [`EXPENSES_LAYER_CHECKLIST.md`](../economy/EXPENSES_LAYER_CHECKLIST.md).

---

## 1. Objective

### 1.1 Why

В текущем MVP **пропущен логический пласт** симулятора: между зарплатой и кредитами игрок не видит и не управляет **регулярным burn rate на жизнь**. Это ломает:

- педагогику («куда уходит зарплата»);
- баланс шаблонов (сложность = не только долги);
- события (подписки, переезд, «собака» — должны бить в **категории**);
- победу и достижения (доля расходов в доходе);
- задел Plan Mode (статьи бюджета).

### 1.2 Success criteria (эпик целиком)

- [ ] Каталог категорий и строки бюджета на профиле — **источник правды** для burn.
- [ ] Шаблоны Game задают **разбивку** расходов, не только одно число.
- [ ] `process_period_end` списывает burn с **breakdown по категориям**.
- [ ] API: total + breakdown + `total_monthly_outflow`; совместимость `monthly_lifestyle_expense`.
- [ ] UI Game: дашборд + экран «Расходы» + итог периода.
- [ ] События меняют статьи/категории; контент-гайд для авторов.
- [ ] Victory / achievements / analytics согласованы с [`EXPENSES_SYSTEM`](../gameplay/EXPENSES_SYSTEM.md) §6.
- [ ] Миграция существующих профилей без поломки экономики.
- [ ] Документация: GLOSSARY, CLAUDE, TRACEABILITY, бэклог.

---

## 2. Scope по волнам

| Волна | Фокус | Out of scope волны |
|-------|--------|---------------------|
| **A** | DB + домен + period + overview + миграция шаблонов | Rich UI |
| **B** | Frontend Game: видимость, копирайт cashflow | Plan редактор |
| **C** | События, victory, achievements, analytics | Manual pay |
| **D** | Plan Mode CRUD, префилл | Инфляция, due-даты |

---

## 3. Матрица слоёв (краткая)

Полная таблица с чекбоксами: [`EXPENSES_LAYER_CHECKLIST.md`](../economy/EXPENSES_LAYER_CHECKLIST.md).

| Слой | Ключевые артефакты |
|------|-------------------|
| **Product / GDD** | SPEC_PRODUCT §12, evolution §II, GLOSSARY |
| **DB** | `expense_category_definitions`, `profile_expense_lines`, миграция `0013+`, blueprint `expense_budget` |
| **Domain** | `expenses.py`, `compute_monthly_burn`, expiry, clamp |
| **Period** | `game_period.py` списание + breakdown |
| **API** | overview, `GET /game/expenses`, period end payload, `api.js` |
| **Events** | effects whitelist, сиды, авторский гайд |
| **Templates** | все `game_starter_templates` — разбивка + чеклист жильё/ипотека |
| **Victory** | `expense_to_income_ratio`, шаблоны |
| **Achievements** | `monthly_reference_expense` |
| **Analytics** | timeseries burn, stress metrics |
| **Frontend** | Dashboard, Finance tab?, Analytics, period summary |
| **Content** | 20+ событий с expense effects (постепенно) |
| **QA** | pytest + плейтест-скрипт |
| **Ops** | admin watchtower? (опционально: алерт burn > income) |

---

## 4. Data model (норматив)

См. [`EXPENSES_SYSTEM.md`](../gameplay/EXPENSES_SYSTEM.md) §4.

### 4.1 Blueprint (шаблон)

```json
{
  "expense_budget": {
    "housing": 12000,
    "food": 8000,
    "transport": 3500,
    "communications": 1500,
    "health": 2000,
    "clothing": 1500,
    "leisure": 3000,
    "other": 0
  }
}
```

Сумма **должна** совпадать с `base_monthly_lifestyle_expense` (валидатор при сидировании). Если `expense_budget` отсутствует — **дефолтные доли** по `template_key` (документировать в `expense_template_defaults.py`).

### 4.2 API overview (расширение)

```json
{
  "monthly_burn_total": 28500,
  "monthly_lifestyle_expense": 28500,
  "monthly_burn_breakdown": {
    "baseline": 27000,
    "lines": [
      { "category_key": "food", "title": "Еда", "amount": 8000, "tier": "must", "expires_period_index": null }
    ]
  },
  "total_monthly_outflow": 52000,
  "expense_to_income_ratio": 0.63
}
```

---

## 5. Content rules (шаблоны и события)

1. **Ипотека** → только `liabilities[]`, не `housing` в expense_budget (кроме ЖКУ поверх ипотеки — явно в description).
2. **Аренда** → `housing` в expense_budget, без ипотеки.
3. Событие «подписка» → `communications` или `leisure`, не только total delta.
4. Событие «переезд» → `cash_delta` + изменение `housing` line.
5. Суммарный burn после события ≤ разумный cap от зарплаты шаблона (контент-ревью).

---

## 6. Testing

| Область | Тесты |
|---------|--------|
| Burn compute | `test_expenses_compute.py` |
| Template start | `test_game_start_expense_budget.py` |
| Period end | `test_period_lifestyle_breakdown.py` |
| Events | `test_expenses_events.py` |
| Victory | `test_victory_expense_ratio.py` |
| Migration | профиль только с legacy fields |

---

## 7. Boundaries

**Always:** один расчёт burn на сервере; чеклист жильё/кредит для каждого шаблона; обновить GLOSSARY при новых терминах.

**Ask first:** новые категории; смена правила нехватки cash; включение burn в `net_monthly_cashflow`.

**Never:** дублировать аренду и ипотеку; хранить burn только в UI; отдельные «скрытые» расходы вне `profile_expense_lines`.

---

## 8. Product decisions (зафиксировано)

| Тема | Решение |
|------|---------|
| Жильё старт | Минимальный `housing`; рост по сложности шаблона |
| Нехватка cash | Списание в минус (v1) |
| Дашборд | Одна цифра burn |
| Финансы | Блок с **3–5 топ-категориями** + полный список |

Оставшиеся вопросы: [`expenses-mechanic.md`](../../vision/ideas/expenses-mechanic.md).

---

## 9. История

| Дата | Изменение |
|------|-----------|
| 2026-05-19 | v0.1: узкий lifestyle aggregate |
| 2026-05-19 | **v1.0 draft:** полный слой жизнеобеспечения, матрица слоёв, волны A–D |
