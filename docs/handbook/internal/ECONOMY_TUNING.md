---
layer: handbook-internal
status: active
last_reviewed: 2026-05-30
audience: product, game-design, engineering
source_of_truth: code + ADR-009
---

# Экономика — формулы и tuning (команда)

Синхронизировать при изменении `overview_build`, `victory/snap`, `game/rules.py`, `needs/engine.py`, seeds шаблонов.

---

## 1. Метрики overview (TB1)

Канон имён — [ADR-009 §2](../../decisions/ADR-009-metrics-dictionary-tb1.md).

### 1.1. Структура расходов

```
structural_obligations = Σ monthly_payment(долги) + Σ monthly_maintenance(активы)

lifestyle_burn = base_monthly_lifestyle_expense + Σ event_lifestyle_deltas (+ plan lines в MVP 2.0)

total_monthly_outflow = structural_obligations + lifestyle_burn
```

### 1.2. Cashflow (не путать)

```
net_monthly_cashflow = total_income_steady [+ invest projection в overview] − structural_obligations
```

**Не включает** `lifestyle_burn`.

Для цели подушки (`safety_fund_months`) в victory snap используется **`monthly_expenses_total`** = structural + lifestyle (полное давление).

### 1.3. Средний ликвидный поток

```
avg_net_cashflow_6p — среднее Δ(cash + safety_fund) между соседними закрытиями периода (до 6 точек)
```

### 1.4. Streak

```
clean_period_streak += 1  если total_overdue_amount == 0 на закрытии
```

**Не** означает cash ≥ 0.

---

## 2. События

```
EVENTS_PER_PERIOD = 2   # backend/app/game/rules.py

event_tier L = floor((period_index − 1) / 10) + 1

Окно отбора: event_tier ∈ [max(1, L−2), L]  (fallback P1: [1, L])
```

Политики: `repeat_policy`, `cooldown_periods` — в YAML каталога и БД (миграция `0007`).

---

## 3. Победа (Victory v2)

Из `victory_config_json` шаблона:

- **`progression_mode: chain`** — все enabled шаги `met` + `period_index >= min_period_index_for_victory` (дефолт **7**).
- **`progression_mode: parallel`** — M из N enabled + ворота периода.

Код: `backend/app/victory/engine.py`, сборка в `finance/overview_build`.

Legacy `evaluate_mvp_victory` (AND подушка + cashflow + no overdue) — **только тесты**.

---

## 4. Поражение

### 4.1. Cash

После `process_period_end`, если `cash_balance < 0`:

- инкремент счётчика серии;
- при **3 подряд** → `defeat_reason = cash_negative_streak`.

Код: `backend/app/game/period.py`.

### 4.2. Потребности (Game, `needs.enabled`)

Оси: `comfort`, `status`, `social`, `health` ∈ [0, 100], шаг 0.1.

**Decay за период** (`needs/engine.py`):

```
Если blueprint.needs.decay_per_period задан:
  decay[axis] = override[axis]

Иначе:
  decay[axis] = initial[axis] / periods_to_empty_target

  periods_to_empty_target default = 12  → ~12 периодов до нуля без пополнения

after[axis] = clamp(before[axis] − decay[axis])
```

**Поражение:** ось == 0 три закрытых периода подряд → `needs_depletion`.

**Treat-self:**

```
cooldown_periods default = 15
cost = clamp(monthly_salary × cost_pct_salary, cost_min, cost_max)
  default pct = 8%, min = 2000, max = 25000
```

Distressed penalty (если шкала в зоне distressed после decay): см. `consequences.distressed_cash_penalty_*` в blueprint.

---

## 5. Balance playtest (headless)

Политики бота: `tutorial`, `safety_first`, `passive` — [`docs/balance/README.md`](../../balance/README.md).

Пороги diff: [`docs/balance/THRESHOLDS.md`](../../balance/THRESHOLDS.md).

```powershell
cd backend
python scripts/balance_playtest.py
```

RNG seed по умолчанию: **42** (воспроизводимость).

---

## 6. Черновик порогов продукта

Не KPI волны — ориентиры для дизайна; цифры KPI — отдельная сессия.

| Тема | Ориентир | Источник |
|------|----------|----------|
| Подушка (учебная цель) | 3–6 мес. lifestyle pressure | GAME, goals |
| Pre-Alpha прогресс | ~80% до 3–4 периода (мягкая линза) | PRE_ALPHA protocol |
| Min period victory | 7 (типично tutorial) | seeds |

Расширение: [`game-balance-thresholds-and-constraints.md`](../../vision/ideas/game-balance-thresholds-and-constraints.md).

---

## 7. Чеклист при изменении экономики

- [ ] ADR-009 / GLOSSARY при новых полях API  
- [ ] `MVP_AUDIT_VS_SPEC` при смене prod-поведения  
- [ ] Прогон `balance_playtest` + diff к baseline  
- [ ] `DOC_SYNC_LOG`  
- [ ] Публичный [`ECONOMY_OVERVIEW.md`](../ECONOMY_OVERVIEW.md) — только если меняется **смысл**, не константа  

---

*Обновлено: 2026-05-30.*
