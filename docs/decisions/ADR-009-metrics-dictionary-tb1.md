---
status: accepted
date: 2026-05-29
deciders: продукт (ответы на открытые вопросы GDD-аудита)
---

# ADR-009: Словарь метрик TB1 и продуктовые решения по давлению

## Context

Аудит механик (2026-05-29) выявил расхождения между документацией, UI и кодом:

- «до 3 событий» в foundation vs **`EVENTS_PER_PERIOD = 2`** в prod;
- **`net_monthly_cashflow`** не включает lifestyle burn, а цель подушки — включает;
- разные базы «дохода» в overview и в типах целей victory;
- **`clean_period_streak`** = нет просрочки, а не «здоровый cash»;
- несколько источников правды для целей победы (JSON шаблона, `victory_goals`, legacy MVP в тестах).

Нужен **единый словарь метрик** для агентов, UI-копирайта и баланса, плюс зафиксированные продуктовые ответы.

## Decision

### 1. Продуктовые решения (зафиксировано)

| # | Вопрос | Решение |
|---|--------|---------|
| Q1 | Победа на лёгком шаблоне без инвестиций? | **Нет.** Учебная цепочка с шагом «открыть депозит/облигацию» — **осознанный онбординг**, не баг. Отдельный «no-invest» шаблон — только если появится в каталоге с другим `victory_config_json`. |
| Q2 | Второй game over по суммарной просрочке? | **Не вводить.** Единственный автоматический game over MVP: **3 подряд закрытых периода с `cash_balance < 0`** после `process_period_end`. Просрочка давит через цели (`no_overdue`), `clean_period_streak`, UX — без отдельного поражения. |
| Q3 | Событий за период | **2** (`EVENTS_PER_PERIOD` в `backend/app/game/rules.py`). Документация синхронизируется; до 3 — не планировать без пересмотра anti-fatigue ([`event-engagement-anti-fatigue.md`](../vision/ideas/event-engagement-anti-fatigue.md)). |

### 2. Словарь метрик (канон имён)

Имена полей API сохраняются для совместимости; **смысл** и подписи в UI — по таблице.

#### 2.1. Балансы

| Поле / термин | Смысл | Единица |
|---------------|--------|---------|
| `cash_balance` | Операционный счёт (события, зарплата, списания периода) | ₽ |
| `safety_fund_balance` | Подушка (отдельный кошелёк) | ₽ |
| `total_debt_balance` | Сумма тел активных обязательств | ₽ |
| `total_overdue_amount` | Непогашенный хвост по долгам (все активные) | ₽ |

#### 2.2. Давление за период (структура)

| Термин в ADR | Состав | Где в коде сейчас |
|--------------|--------|-------------------|
| **`structural_obligations`** | Σ `monthly_payment` по долгам + Σ `monthly_maintenance_cost` по активам | `total_monthly_obligations` в overview / victory snap |
| **`lifestyle_burn`** | База шаблона + дельты событий + статьи Plan (если есть) | `monthly_burn_total`, `compute_monthly_burn` |
| **`total_monthly_outflow`** | `structural_obligations` + `lifestyle_burn` | `overview_build` (не отдельное поле в victory snap) |
| **`total_income_steady`** | Зарплата + `monthly_income` активов | Часть расчёта overview |
| **`total_income_with_invest_projection`** | steady + проекция инвестдохода (1/12 годовой ставки по позициям) | `total_income` в overview |

#### 2.3. Cashflow-метрики (критично не путать)

| Поле API | Формула (канон смысла) | Включает lifestyle burn? | Использование |
|----------|------------------------|---------------------------|---------------|
| **`net_monthly_cashflow`** | `total_income_steady` (+ опционально invest в overview) − **`structural_obligations`** | **Нет** | Цель `net_monthly_cashflow_nonneg`; дашборд «структурный поток» |
| **`expense_to_income_ratio` (overview)** | `lifestyle_burn` / `total_income_with_invest_projection` | Только burn в числителе | KPI на вкладке финансов |
| **`expense_to_income_ratio` (goal)** | `lifestyle_burn` / **`monthly_salary`** | Только burn | Цель `expense_to_income_ratio` в victory JSON |
| **`monthly_expenses_total`** (victory snap) | `structural_obligations` + `lifestyle_burn` | Да (полное давление) | Цель `safety_fund_months` (`pressure_monthly`) |
| **`avg_net_cashflow_6p`** | Среднее Δ(`cash` + `safety`) между соседними **закрытиями** периода | Факт, не формула | Цели `avg_liquid_delta_6p`; аналитика |
| **`period_income_rate` / `period_expense_total`** | Факт за **закрытый** период из breakdown | Да для expense | `PeriodEconomyClosing`, аналитика |

**Правило для UI и агентов:** если текст говорит «можешь жить этот месяц» — показывать **`total_monthly_outflow`** и остаток после всех списаний, а не голый `net_monthly_cashflow`.

#### 2.4. Прогрессия и события

| Термин | Правило |
|--------|---------|
| **`event_tier` L** | `L = floor((period_index − 1) / 10) + 1` |
| Окно отбора | `event_tier ∈ [max(1, L−2), L]` (core); fallback P1: `[1, L]` |
| **Событий за период** | **2** инстанса (`EVENTS_PER_PERIOD`) |
| **`clean_period_streak`** | +1 за период, если **`total_overdue_amount == 0`** на закрытии; **не** означает cash ≥ 0 |

#### 2.5. Победа и поражение

| Термин | Правило |
|--------|---------|
| **`win_reached`** | `victory_engine` + `victory_config_json` шаблона; prod: **`progression_mode: chain`** (tutorial) |
| **`period_gate_open`** | `period_index >= min_period_index_for_victory` (дефолт **7**) |
| **Game over** | `negative_periods_count >= 3` подряд при `cash_balance < 0` на закрытии |
| **Tutorial invest step** | Обязателен в цепочке базового шаблона; не смешивать с «победа без капитала» |

### 3. Источники правды (иерархия)

1. **Код + pytest** (production paths).
2. **`docs/specs/features/SPEC_*.md`**.
3. **`docs/foundation/SPEC_PRODUCT.md`**.
4. Этот ADR + [`game-balance-thresholds-and-constraints.md`](../vision/ideas/game-balance-thresholds-and-constraints.md).
5. `docs/vision/ideas/` — направление, не детали формул.

**Цели победы (редактирование):** `game_starter_templates.victory_config_json` → при наличии строк — override из `victory_goals` ([`goals_store.py`](../../backend/app/victory/goals_store.py)). Legacy `evaluate_mvp_victory` — **только unit-тесты**, не overview.

**События (контент):** `data/events/mvp11/*.yaml` → `mvp11_catalog` → `ensure_mvp11_event_catalog` ([ADR-008](ADR-008-events-catalog-single-source.md)).

### 4. Целевой рефакторинг (не блокер ADR)

Вынести расчёты в один модуль, например `backend/app/finance/economy_metrics.py`:

```text
EconomySnapshot → structural_obligations, lifestyle_burn, outflow, incomes, net_structural, ...
```

Overview, victory snap и аналитика потребляют один снимок. До рефакторинга — **следовать таблице §2.3**, не дублировать формулы в новых целях.

## Consequences

- Синхронизация docs: см. таблицу в [`DOC_SYNC_LOG.md`](../foundation/DOC_SYNC_LOG.md) (запись 2026-05-29, ADR-009).
- Новые типы целей victory — только с явной колонкой «база метрики» в spec и проверкой в `goals_lint`.
- Симуляция баланса: [`backend/scripts/balance_simulate.py`](../../backend/scripts/balance_simulate.py) (40 периодов, политики `tutorial` | `safety_first` | `passive`, JSON + diff); краткий wrapper 12p — [`simulate_student_12p.py`](../../backend/scripts/simulate_student_12p.py); процедура — [`docs/balance/README.md`](../balance/README.md), skill **`balance-playtest`**.
- UI: backlog — подписи «структурный поток» vs «расходы на жизнь»; переименование streak в копирайте.

## Alternatives considered

1. **Поднять `EVENTS_PER_PERIOD` до 3** — отклонено: anti-fatigue, TMA-сессия 1–3 мин.
2. **Game over по просрочке** — отклонено (Q2).
3. **Убрать invest из tutorial chain** — отклонено (Q1); ломает онбординг капитала.
4. **Переименовать поля API** (`net_monthly_cashflow` → `net_structural_cashflow`) — отложено; breaking для клиента; сначала UI labels.

## Связанные артефакты

- [`SPEC_PRODUCT.md`](../foundation/SPEC_PRODUCT.md) §3.3, §7
- [`GAME.md`](../../GAME.md) §0.2
- [`MVP_AUDIT_VS_SPEC.md`](../foundation/MVP_AUDIT_VS_SPEC.md)
- [`ADR-002`](ADR-002-victory-engine-and-template-config.md), [`ADR-004`](ADR-004-mechanics-unlock-victory-chain.md), [`ADR-008`](ADR-008-events-catalog-single-source.md)
- [`SKILLS_PHASE_CONTENT_AND_DATA.md`](../agents/SKILLS_PHASE_CONTENT_AND_DATA.md) — границы скиллов
