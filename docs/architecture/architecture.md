# ТВОЙ ХОД — Master Architecture (Character Needs + контекст стека)

## Document Status

| Поле | Значение |
|------|----------|
| Version | 1.1 |
| Last Updated | 2026-05-26 |
| Scope | **Фаза 1:** система потребностей персонажа ([`game-character-needs-foundation.md`](../vision/ideas/game-character-needs-foundation.md)) |
| Stack | **FastAPI** + **SQLAlchemy** + **PostgreSQL**; **React** (Vite) TMA; без Alembic — SQL в `backend/migrations/` |
| GDD / vision covered | `game-character-needs-foundation`, `tvoy-hod-evolution-after-mvp` §II (персонаж/шаблон), `remove-character-xp-and-levels` |
| ADRs referenced | ADR-001 … ADR-006 (needs: 005, 006) |
| Technical Director Sign-Off | 2026-05-26 — **APPROVED** (lean: LP-FEASIBILITY skipped) |
| Lead Programmer Feasibility | **FEASIBLE** (lean) |

---

## Engine / Stack Knowledge Summary

Проект — **финансовая TMA**, не движок Godot/Unity. «Платформа» — HTTP API + React UI.

| Домен | Риск изменений | Комментарий |
|-------|----------------|-------------|
| Периодный цикл (`game_period.process_period_end`) | MEDIUM | Центральная точка — порядок хуков критичен |
| События (`events.py`, `effects_json`) | MEDIUM | Расширение `ALLOWED_EFFECT_KEYS` |
| Overview (`finance_overview_build`) | LOW | Добавление блока `needs` |
| Victory v2 | LOW | **Не заменяется** потребностями (ADR-002) |
| Character XP | N/A | Снято (ADR-003) |

---

## Technical Requirements Baseline

Извлечено из vision **game-character-needs-foundation** | **12** требований

| Req ID | Источник | Требование | Домен |
|--------|----------|------------|--------|
| TR-needs-001 | Фаза 1 | 4 шкалы: Комфорт, Статус, Связи, Здоровье (0–100) | State |
| TR-needs-002 | Фаза 1 | Decay за период с коэффициентами **per starter template / archetype** | Rules |
| TR-needs-003 | Фаза 1 | Пополнение шкал через **effects событий** | Events |
| TR-needs-004 | Фаза 1 | **«Порадовать себя»:** cash, кулдаун 15 периодов, выбор из `treat_self.options[]` (MVP ≥1), `needs_delta` per option | Period actions |
| TR-needs-005 | Фаза 1 | Последствия просадки **зависят от archetype** (мягкий vs жёсткий) | Rules / defeat |
| TR-needs-006 | Фаза 1 | Один источник правды на **сервере**; UI только отображает | API |
| TR-needs-007 | Фаза 1 | Decay / consequences в **`process_period_end`** (или вызываемый из него модуль) | Period |
| TR-needs-008 | Фаза 1 | Блок в **`GET /api/finance/overview`** + синхронизация `api.js` | API / FE |
| TR-needs-009 | Фаза 1 | Минимум 1–2 события с `needs_delta` для проверки цикла | Content |
| TR-needs-010 | Фаза 1 | Персонаж MVP = **`starter_template_key`** + секция в `blueprint_json` | Data model |
| TR-needs-011 | Не делать | Не возвращать character XP/level | ADR-003 |
| TR-needs-012 | Не делать | Победа остаётся Victory v2 из шаблона | ADR-002 |

**Фазы 2–3 (в архитектуре заложены, не в MVP):**

| Req ID | Фаза | Требование |
|--------|------|------------|
| TR-needs-201 | 2 | События: один effect, разный контекст по archetype / tags |
| TR-needs-202 | 2 | Фильтр пула событий по `template_key` / character tags |
| TR-needs-301 | 3 | Unlock следующего персонажа после прохождения «главы» |
| TR-needs-302 | 3 | Мета-прогресс кампании (не XP) |

---

## System Layer Map

```
┌─────────────────────────────────────────────────────────────┐
│  PRESENTATION (React)                                        │
│  GameTemplatePickScreen → «Выбор персонажа»                  │
│  Dashboard: MqxNeedsBars, «Порадовать себя»                  │
│  Events: choice UI (без смены контракта карточки)            │
├─────────────────────────────────────────────────────────────┤
│  FEATURE                                                     │
│  needs_engine · treat_self · needs_consequences              │
│  events (needs_delta) · victory_engine (unchanged)           │
├─────────────────────────────────────────────────────────────┤
│  CORE                                                        │
│  game_period.process_period_end · period_actions             │
│  finance_overview_build · achievement_engine (optional)    │
├─────────────────────────────────────────────────────────────┤
│  FOUNDATION                                                  │
│  models GameProfile · GameStarterTemplate.blueprint_json     │
│  migrations · schemas · routers                              │
└─────────────────────────────────────────────────────────────┘
```

| Модуль | Слой | Фаза |
|--------|------|------|
| `needs_engine` | Feature | **1** |
| `needs_config` (parse blueprint) | Feature | **1** |
| `event_choice` needs effects | Feature | **1** |
| `character_event_filter` | Feature | **2** |
| `character_campaign_unlock` | Feature | **3** |
| `game_period` hooks | Core | **1** |
| `MqxNeeds*` UI | Presentation | **1** |

---

## Module Ownership

### `needs_engine` (новый: `backend/app/needs/engine.py`)

| | |
|--|--|
| **Owns** | Правила decay, clamp 0–100, применение `needs_delta`, расчёт «Порадовать себя», пороги и **consequence tier** (мягкий/жёсткий) |
| **Exposes** | `apply_period_needs_decay(profile, config) → NeedsState`, `apply_needs_delta(state, delta)`, `evaluate_needs_after_period(state, config) → NeedsPeriodResult`, `compute_treat_self(state, config, profile) → TreatSelfResult` |
| **Consumes** | `NeedsConfig` из шаблона; `GameProfile` поля шкал; `period_index` |
| **Не владеет** | cash/safety (вызывает `adjust_balance` из роутера/period_actions) |

### `needs_config` (новый: `backend/app/needs_config.py`)

| | |
|--|--|
| **Owns** | Парсинг `blueprint_json.needs` (decay rates, thresholds, treat_self, consequence_profile) |
| **Exposes** | `needs_config_for_template(template_row) → NeedsConfig` |
| **Consumes** | `GameStarterTemplate` |

**Рекомендуемая форма в blueprint (MVP):**

```json
{
  "needs": {
    "initial": { "comfort": 70, "status": 50, "social": 60, "health": 75 },
    "periods_to_empty_target": 12,
    "thresholds": { "low": 40, "distressed": 30 },
    "consequence_profile": "soft",
    "treat_self": {
      "cooldown_periods": 15,
      "default_cost_pct_salary": 0.08,
      "options": [{ "id": "picnic_friends", "title": "…", "needs_delta": {} }]
    }
  }
}
```

`consequence_profile`: `soft` | `standard` | `hard` — сила последствий при <30% и уровень подсказок (поражение при нуле — у всех). См. [SPEC](../specs/features/SPEC_game-character-needs.md).

### `GameProfile` (расширение)

| | |
|--|--|
| **Owns** | Текущие значения 4 шкал; `treat_self_last_used_period_index` (кулдаун) |
| **Exposes** | Через overview / period status |

**Решение по open question (хранение):** четыре колонки `FLOAT` на `game_profiles` + один `INTEGER` для кулдауна — проще overview, индексы, отладка. JSON-only отложить, если появятся временные баффы.

Предлагаемые колонки:

- `need_comfort`, `need_status`, `need_social`, `need_health` (default из blueprint при создании профиля)
- `needs_zero_periods_streak` (поражение при ≥3)
- `treat_self_last_period_index` (0 = never)

### `events` router (расширение)

| | |
|--|--|
| **Owns** | Валидация и применение `needs_delta` в `choose event` |
| **Exposes** | Без смены URL; новый ключ в `effects_json` |

```json
"needs_delta": { "comfort": 15, "status": -5, "social": 10, "health": 0 }
```

Добавить в `ALLOWED_EFFECT_KEYS`: `needs_delta`.

### `game_period` (хук)

| | |
|--|--|
| **Owns** | Порядок закрытия периода (существующий) |
| **Consumes** | `needs_engine.apply_period_needs_decay` + `evaluate_needs_after_period` **после** списаний жизни/обязательств, **до** инкремента `period_index` (или сразу после — зафиксировать в spec одним вариантом; рекомендация: **до** `period_index += 1`, чтобы кулдаун и события нового периода видели обновлённые needs) |

### `finance_overview_build`

| | |
|--|--|
| **Owns** | Сборка DTO overview |
| **Exposes** | `overview.needs`, `overview.needs_config_preview` (decay/thresholds для UI) |

### Victory v2

**Не меняется** в фазе 1. Поражение по needs — **отдельный канал** (`defeat_reason: needs_critical` / флаг в ответе `process_period_end`), не подменяет `negative_periods_count` по cash, если продукт не решит объединить.

---

## Data Flow

### 1. Создание профиля (Game + template)

```
POST /api/game/profiles
  → load GameStarterTemplate
  → apply blueprint (salary, assets, …)  [existing]
  → needs_config.initial → set GameProfile.need_* columns
  → treat_self_last_period_index = 0
```

### 2. Период: действие «Порадовать себя»

```
POST /api/game/period/treat-self
  → needs_engine.can_treat_self(profile, config)
  → adjust_balance(-cost)
  → needs_engine.apply_treat_self(profile, config)  # primary axis: weighted random or round-robin
  → treat_self_last_period_index = period_index
  → return PeriodActionResponse + needs snapshot
```

### 3. Событие: выбор

```
POST /api/game/events/{id}/choose
  → [existing cash/safety/expense effects]
  → needs_delta → needs_engine.apply_needs_delta on profile columns
```

### 4. Закрытие месяца

```
POST /api/game/time/next → process_period_end
  → … existing economy …
  → needs_engine.apply_period_needs_decay(profile, config)
  → result = needs_engine.evaluate_needs_after_period(...)
       → soft: flags for UI + enqueue hint event (phase 1 optional)
       → hard: extra burn / cash penalty / increment needs_defeat_streak → defeat at 3
  → period_index += 1
  → ensure_period_events (phase 2: filter by character tags)
```

### 5. Чтение UI (дашборд)

```
GET /api/finance/overview
  → needs: { comfort, status, social, health }
  → treat_self: { available, cost, cooldown_periods_remaining }
  → needs_meta: { consequence_profile, thresholds }  // для полосок/цветов
```

---

## API Boundaries

### `GET /api/finance/overview` — блок `needs`

```python
class NeedsOverview(BaseModel):
    comfort: float
    status: float
    social: float
    health: float

class TreatSelfOverview(BaseModel):
    available: bool
    cost: float
    cooldown_periods_remaining: int
    blocked_reason: str | None = None

class NeedsMetaOverview(BaseModel):
    critical_threshold: float
    low_threshold: float
    consequence_profile: str  # soft | standard | hard
```

### `POST /api/game/period/treat-self` (новый)

- **Auth:** как `claim-salary` (active profile, game save_kind).
- **Guards:** `time_state` открытый период; `available`; достаточно `cash`.
- **Idempotency:** рекомендуется тот же паттерн `Idempotency-Key`, что у других period POST.
- **Response:** обновлённые `needs` + `cash_balance` (+ опционально `overview` subset).

### `GET /api/game/period/status` (расширение)

Добавить `needs` и `treat_self.available` для лёгкого polling без полного overview.

### Event `effects_json`

| Ключ | Тип | Инварианты |
|------|-----|------------|
| `needs_delta` | `object` с опциональными `comfort`, `status`, `social`, `health` | Числа в [-100, 100] за один выбор; итог clamp 0–100 на профиле |

### Внутренний контракт `NeedsPeriodResult`

```python
@dataclass
class NeedsPeriodResult:
    decay_applied: dict[str, float]
    any_critical: bool
    consequences: list[NeedsConsequence]  # typed: extra_burn, cash_penalty, defeat_warning
    defeat_triggered: bool
    defeat_reason: str | None
```

---

## ASCII: зависимости модулей (фаза 1)

```
                    ┌──────────────────┐
                    │ GameStarterTemplate│
                    │ blueprint.needs  │
                    └────────┬─────────┘
                             │
    ┌────────────────────────┼────────────────────────┐
    ▼                        ▼                        ▼
needs_config          GameProfile              events.choose
    │                   need_* cols                  │
    └──────────► needs_engine ◄─────────────────────┘
                      │
         ┌────────────┼────────────┐
         ▼            ▼            ▼
  period_actions   game_period   finance_overview_build
  treat-self       process_period_end
```

---

## ADR Audit

| ADR | Совместимость с needs | Конфликт | Действие |
|-----|----------------------|----------|----------|
| ADR-001 save_kind | OK | — | Plan mode: needs **выключены** или отдельный blueprint flag `needs_enabled: false` |
| ADR-002 Victory v2 | OK | — | Победа не от needs |
| ADR-003 No character XP | OK | — | Needs **заменяют** мотивацию XP, не дублируют |
| ADR-004 Mechanics unlock | OK | — | Независимые оси |

### Traceability (фаза 1)

| Req ID | Покрытие в архитектуре | ADR нужен |
|--------|------------------------|-----------|
| TR-needs-001–010 | Модули выше | **ADR-005** (рекомендуется) |
| TR-needs-011–012 | Явно в Not Doing | — |

---

## Required ADRs (Phase 6)

**Фаза 1 — принято:**

1. **[ADR-005](../decisions/ADR-005-character-needs-state-and-defeat.md)** — decay ~10–15 периодов, поражение при нуле 3 периода подряд (все персонажи).
2. **[ADR-006](../decisions/ADR-006-treat-self-options-and-cooldown.md)** — treat-self: `options[]` (MVP ≥1), кулдаун 15.

**Перед фазой 2:**

3. **ADR-007: Character-scoped event catalog** (tags, template filter, content variants)

**Перед фазой 3:**

4. **ADR-008: Character campaign unlock** (meta-progress without XP)

---

## Architecture Principles

1. **Сервер — единственный судья** шкал и кулдауна; клиент не применяет decay локально.
2. **Персонаж = жизнь (template)**, не отдельная таблица в MVP; UI говорит «персонаж», API хранит `starter_template_key`.
3. **Потребности давят, победа меряет** — Victory v2 и needs — разные оси (удержание vs финансовая грамотность).
4. **Расширение через blueprint и effects_json**, без второго движка правил.
5. **Фазы изолированы:** фаза 1 shippable без event tagging и без campaign unlock.

---

## MVP Implementation Order (для программиста)

1. Migration: колонки `need_*`, `treat_self_last_period_index`; seed `blueprint_json.needs` для 4 Game-шаблонов.
2. `needs_config.py` + `needs/engine.py` + unit tests.
3. Hook `process_period_end` + defeat/penalty path для `hard`.
4. `POST treat-self` + расширение `period/status` и overview.
5. `needs_delta` в events + 1–2 seed events.
6. Frontend: `api.js`, overview hook, `MqxNeedsBars`, кнопка на дашборде; переименование экрана шаблонов → «Выбор персонажа» (копирайт + i18n keys).
7. Spec: `docs/specs/features/SPEC_game-character-needs.md`.

---

## Not Doing (фаза 1)

- Маслоу как 5-й механический слой (только UX-метафора позже).
- Два голоса / дневник с ветвлением.
- Социальные обещания как отдельная state machine.
- Фильтр событий по персонажу (фаза 2).
- Unlock персонажей после победы (фаза 3).
- Отдельная таблица `characters` до необходимости campaign.

---

## Open Questions (с рекомендациями)

| ID | Вопрос | Рекомендация architecture v1 |
|----|--------|--------------------------------|
| QQ-01 | Decay фиксированный или от stress? | **Фиксированный** из blueprint; stress — фаза 1.1 |
| QQ-02 | Цена treat-self | `% от monthly_salary`** с floor/ceiling в blueprint |
| QQ-03 | Floor шкал | **0** допустим; defeat по `consequence_profile`, не hard floor 10 |
| QQ-04 | Поражение | **Все персонажи:** шкала == 0 три периода подряд; soft/hard — сила помощи и штрафов <30% |
| QQ-05 | Когда decay относительно period_index | **В конце периода N** перед переходом на N+1 |
| QQ-06 | Plan mode | `needs_enabled: false` в plan templates |

---

## Заготовки фаз 2–3 (без реализации)

### Фаза 2 — Event personalization

- `EventDefinition.audience_json`: `{ "templates_any": ["mq_game_basic_v1"], "tags": ["student"] }`
- `resolve_choice_effects_for_definition` уже паттерн для контекста — расширить для **variant text** (отдельная таблица `event_definition_variants` или nested JSON).
- `ensure_period_events`: фильтр по `starter_template_key`.

### Фаза 3 — Campaign

- Таблица `user_character_progress` (`user_id`, `character_key`, `completed_at`) или флаги на `users`.
- Unlock следующего `template_key` в UI `GameTemplatePickScreen` (не POST arbitrary key).
- Победа по chain tutorial → отметка complete → показать следующую «главу».

---

## Связанные документы

- Vision: [`docs/vision/ideas/game-character-needs-foundation.md`](../vision/ideas/game-character-needs-foundation.md)
- Следующий шаг: **`docs/specs/features/SPEC_game-character-needs.md`** (формулы, точные пороги, copy)
- UI: [`docs/specs/SPEC_FRONTEND_UI.md`](../specs/SPEC_FRONTEND_UI.md), MQX workflow
- Период: `backend/app/game/period.py`, `backend/app/routers/period_actions.py`
