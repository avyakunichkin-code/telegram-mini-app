---
layer: spec
status: approved
owner: product
last_reviewed: 2026-05-25
tracks: victory-v2, game-plan
idea: vision/ideas/tvoy-hod-evolution-after-mvp.md
related: specs/features/SPEC_game-plan.md
related_progression: vision/ideas/remove-character-xp-and-levels.md
adr: decisions/ADR-001-save-kind-remove-light-hardcore.md, decisions/ADR-002-victory-engine-and-template-config.md, decisions/ADR-004-mechanics-unlock-victory-chain.md
supersedes_goal_types: character_level (removed 2026-05-24, migration 0031)
---

# Spec: Victory v2 — M из N по шаблону

## Assumptions

1. **C2:** у каждого активного `game_starter_templates` задан валидный `victory_config_json`; пустого `{}` нет; fallback MVP в коде не используется.
2. **A1:** знаменатель цели «подушка в месяцах» = только **`total_monthly_obligations`** (платежи по долгам + обслуживание активов), **без** lifestyle.
3. **B1 + B3:** цель `avg_liquid_delta_6p` — среднее Δ(cash + подушка) между соседними `PeriodEconomyClosing`; порог — **`current_monthly_salary * salary_multiplier`** (текущая зарплата профиля, т.к. зарплату можно менять в игре).
4. **D1:** победа = **`met_count >= required_goals_met`** среди целей с `enabled: true`; отдельного слоя must-have в v2.0 нет.
5. **F1:** после `win_reached` партия **продолжается** (`is_active` не сбрасывается).
6. **E:** достижения и победа — разные продукты; допускается общий хелпер обязательств, без дублирования целей в `achievement_tier_definitions`.
7. Поле **`goals[].required`** хранится в JSON для будущей фазы («все required + M из optional»); в v2.0 **игнорируется** движком.

---

## Objective

**Why:** разные сценарии Game Mode должны иметь разную планку победы без хардкода в `finance.py`.

**Success criteria**

- [ ] `GET /api/finance/overview` считает победу по `victory_config_json` шаблона профиля (`starter_template_key`).
- [x] Prod: tutorial **chain** на всех Game-шаблонах (`victory_seeds.py`, миграции `0036`/`0037`).
- [x] Legacy parallel (M из N) — `VICTORY_CONFIG_LEGACY_BY_TEMPLATE_KEY` для отката.
- [ ] Блок `victory` в overview + сохранены legacy-поля `win_*` для UI подушки.
- [ ] Unit-тесты на парсинг config и оценку целей.

---

## Контракт `victory_config` (schema_version 1)

```json
{
  "schema_version": 1,
  "min_period_index_for_victory": 7,
  "required_goals_met": 3,
  "goals": [
    {
      "key": "safety_3x",
      "type": "safety_fund_months",
      "title": "Подушка ≥ 3× обязательств",
      "months_multiplier": 3,
      "required": false,
      "enabled": true
    }
  ]
}
```

| Поле | Тип | Описание |
|------|-----|----------|
| `schema_version` | int | Сейчас только `1` |
| `min_period_index_for_victory` | int | Победа недоступна при `period_index` ниже (дефолт **7**) |
| `required_goals_met` | int | **M** в режиме **`parallel`**; в **`chain`** не ограничивает победу (нужны все шаги цепочки) |
| `progression_mode` | string | `chain` (prod tutorial) или `parallel` (legacy M из N) |
| `goals[]` | array | Список целей |
| `goals[].key` | string | Стабильный id для API/UI |
| `goals[].type` | string | См. таблицу типов |
| `goals[].title` | string | Человекочитаемое название |
| `goals[].required` | bool | Зарезервировано; default `false` |
| `goals[].enabled` | bool | Участвует в N, если `true` |

### Типы целей (v2.0)

| `type` | Параметры | Условие `met` |
|--------|-----------|---------------|
| `safety_fund_months` | `months_multiplier` | `safety_fund >= obligations * multiplier` и `obligations > 0` |
| `no_overdue` | — | `total_overdue_amount <= 0` |
| `net_monthly_cashflow_nonneg` | — | `net_monthly_cashflow >= 0` |
| `avg_liquid_delta_6p` | `window` (default 6), `min_samples`, `salary_multiplier` **или** `min_avg` | `samples >= min_samples` и (`avg >= salary * multiplier` или `avg >= min_avg`) |
| `cash_balance_min` | `min_cash` | `cash_balance >= min_cash` |
| `expense_to_income_ratio` | `max_ratio` | lifestyle burn ≤ доля дохода |
| `action_once` | `action`, `requires_mechanics?` | флаг действия игрока (учебная цепочка) |
| `passive_income_monthly_min` | `min_monthly` | пассивный доход ≥ порога |
| `passive_income_net_monthly_min` | `min_net` | пассив − расходы ≥ порога |
| `asset_kind_any_owned` | `asset_kinds_any[]` | владение активом вида из списка |

> **`character_level`** удалён из движка и сидов (см. `0031_remove_character_progression.sql`, [`remove-character-xp-and-levels.md`](../../vision/ideas/remove-character-xp-and-levels.md)).

**`avg_liquid_delta_6p`:** тот же алгоритм, что `avg_net_cashflow_6p` / `avg_net_cashflow_6p_n` в overview (интервалы между закрытиями периода).

**Зарплата для B3:** `FinanceSalary.monthly_amount` на момент запроса overview.

---

## Логика победы

**Ворота периода (оба режима):** `period_gate_open = period_index >= min_period_index_for_victory`.

### `progression_mode: parallel` (legacy)

```
enabled_goals = [g for g in goals if g.enabled]
met_count = count(g.met for g in enabled_goals)
win_reached = period_gate_open AND met_count >= required_goals_met
```

### `progression_mode: chain` (prod, tutorial)

Цели обрабатываются **по порядку** в `goals[]`: шаг *i* может стать `met` только если шаг *i−1* уже `met`. Победа:

```
win_reached = period_gate_open AND all(enabled goals in chain are met)
```

`required_goals_met` в chain-режиме **игнорируется** для `win_reached` (в сидах обычно = длине цепочки для ясности).

`required` на целях в v2.0 не меняет формулу ни в одном режиме.

### Legacy `win_ready` (совместимость UI)

Подмножество «почти победа» без подушки и без ворот периода:

- если в config есть цели `no_overdue` и `net_monthly_cashflow_nonneg` (enabled) — обе должны быть `met`;
- иначе `win_ready = met_count >= max(0, required_goals_met - 1)` среди enabled (без учёта `period_gate_open`).

### Legacy `win_target_safety_fund` / `win_progress_safety_fund`

Берутся из **первой** enabled-цели `safety_fund_months`; если такой нет — target `0`, progress `0`.

---

## Сиды шаблонов (контент prod)

Источник: `backend/app/victory_seeds.py` (`VICTORY_CONFIG_BY_TEMPLATE_KEY`). Откат: `VICTORY_CONFIG_LEGACY_BY_TEMPLATE_KEY` (`progression_mode: parallel`).

### `mq_game_basic_v1` — tutorial chain (5 шагов)

1. `tutorial_salary` → 2. `tutorial_cushion` → 3. `tutorial_invest` → 4. `safety_3x` → 5. `invest_income_15k`  
`progression_mode: chain`, `min_period_index_for_victory: 7`

### `mq_game_tight_budget_v1`, `mq_game_mortgage_stress_v1`

7 шагов: tutorial (зарплата, подушка, инвест) → `safety_6x` → `invest_income_80k` → `tutorial_insurance` → финал `cash_balance_min` (10M ₽)

### `mq_game_debt_stack_v1`

То же ядро + финал `rental_home_owned` (сдаваемая недвижимость)

### `mechanics_unlock` (жёсткие шаблоны)

После `tutorial_cushion` — liabilities + invest; после `tutorial_invest` — insurance; после `tutorial_insurance` — property ([ADR-004](../../decisions/ADR-004-mechanics-unlock-victory-chain.md), миграция `0037_*`). **`mq_game_basic_v1`:** invest с первого периода.

### Legacy parallel (откат плейтеста)

`mq_game_basic_v1`: 3× подушка + no_overdue + flow_nonneg + burn_ratio; harder: 6× + avg_liquid + cash_floor + burn_ratio, `required_goals_met: 3`.

---

## API: `GET /api/finance/overview`

Добавить объект **`victory`** (не ломая существующие поля):

```json
{
  "victory": {
    "schema_version": 1,
    "template_key": "mq_game_basic_v1",
    "min_period_index": 7,
    "period_gate_open": true,
    "goals_met": 3,
    "goals_required": 3,
    "goals_enabled": 3,
    "win_reached": true,
    "goals": [
      {
        "key": "safety_3x",
        "type": "safety_fund_months",
        "title": "...",
        "required": false,
        "enabled": true,
        "met": true,
        "progress": 1.0,
        "detail": { "target": 30000, "current": 35000 }
      }
    ]
  },
  "win_reached": true,
  "win_ready": true,
  "win_target_safety_fund": 30000,
  "win_progress_safety_fund": 1.0
}
```

Если у профиля нет `starter_template_key` или шаблон не найден — используется config **`mq_game_basic_v1`** (страховка для legacy-профилей).

---

## Out of scope (v2.0)

- UI экрана победы / тоста (отдельная задача).
- Учёт `goals[].required` в логике.
- Победа в Plan Mode (`save_kind=plan`).
- Достижения как цели победы.

---

## Реализация (код)

| Модуль | Назначение |
|--------|------------|
| `backend/app/victory_engine.py` | Парсинг config, оценка целей, M из N |
| `backend/app/victory_seeds.py` | JSON по `template_key` |
| `backend/migrations/0010_victory_config_seeds.sql` | UPDATE существующих строк каталога |
| `backend/app/routers/finance.py` | Подключение движка в overview |
| `backend/tests/test_victory_engine.py` | Тесты |

`evaluate_mvp_victory` в `game_rules.py` остаётся для unit-тестов MVP-инвариантов; production overview использует `victory_engine`.

---

## Связанные документы

- [evolution §II.3](../../vision/ideas/tvoy-hod-evolution-after-mvp.md)
- [SPEC_game-plan](SPEC_game-plan.md) — задел `victory_config_json`
- [GAME.md](../../../GAME.md) § победа
