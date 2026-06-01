---
layer: spec
status: draft
owner: product
last_reviewed: 2026-05-30
tracks: events, mvp-1-1, pre-alpha
idea: ../../vision/ideas/event-types-and-taxonomy.md
handbook: ../../handbook/EVENTS_TERMS_RU.md
supersedes_partial: SPEC_mvp-11-progression-events.md
---

# Spec: Система событий v2 — слоты, типы контента, аудитория, цепочки, глобальные

> **Статус:** черновик для обсуждения (2026-05-30). **Не implement** до approve.  
> Читать с: [`SPEC_mvp-11-progression-events.md`](SPEC_mvp-11-progression-events.md), [`EVENTS_TERMS_RU.md`](../../handbook/EVENTS_TERMS_RU.md).

## Assumptions

1. Pre-Alpha: **2 игровых choice-события** на период; informational / needs_risk / global **не вытесняют** их.
2. `starter_template_key` на `GameProfile` immutable.
3. **`content_class` — ровно одна «главная» природа события** (см. §Content class); сочетание нескольких типов — **не сейчас** (v2+ может быть «тип + инструменты»).
4. **Инвариант:** `content_class: profile` **запрещён** вместе с `audience_template_keys: ["all"]`.
5. Глобальные события — **свой каталог на шаблон** (`audience` = конкретный ключ); планировщик и cooldown — **на партию** (`game_profile_id`), новая игра = сброс.
6. Informational — **разные триггеры** (цепочки, механики, первый раз открыл вкладку и т.д.).

→ Обновлено по review продукта 2026-05-30.

---

## Objective

**Why:** показать партнёрам и плейтестерам **систему** событий (типы, привязки, цепочки, слоты), а не случайный набор карточек.

**Who:** игрок Game Mode; авторы контента; команда.

**Success criteria:**

- [ ] В каталоге размечены `content_class`, `event_slot`, `audience_template_keys` (или эквивалент в metadata до миграции).
- [ ] За период: **до 2** `period_choice` + **до 1** informational + **до 1** needs_risk (вероятностно) + chain + **до 1** global.
- [ ] `content_class` в каждой записи — **один** из `universal` \| `profile` \| `instrumental` \| `needs_risk` \| `global`; валидация сида отклоняет `profile` + `audience: all`.
- [ ] ≥3 цепочки с **явной отсылкой** к прошлому выбору в тексте follow-up.
- [ ] ≥2 informational в prod UI (отдельный слот).
- [ ] CS-1…CS-5 (§Testing) — pytest + ручной чеклист.

---

## Scope

### In scope

- Модель полей `EventDefinition` (+ YAML catalog).
- Алгоритм `ensure_period_events` → **мульти-слот**.
- `prerequisites_json` v2 (составные условия по инструментам).
- `audience_template_keys` в БД.
- Informational UI (одна кнопка «Понятно»).
- Планировщик global macro (period ≥10, cooldown 10–15).
- Цепочки: контекст в UI + новые briefs (курсы→коллега, брат→лотерея, …).

### Out of scope (этот spec)

- Наполнение каталога «обычными» student/pro копиями (отдельные briefs / create-event).
- Эффекты макро на все ставки в economy engine (можно stub `metadata economy_patch`).
- Plan Mode / `save_kind: plan` фильтр — только `game` + `any`.

---

## Модель данных

### Content class — взаимоисключающая «природа» события

У одной записи каталога **ровно один** `content_class`. Это не «теги», а **либо-либо** (кроме того, что instrumental/needs_risk **дополнительно** задают условия в `prerequisites_json`).

| `content_class` | Смысл | `audience_template_keys` |
|-----------------|-------|---------------------------|
| `universal` | повседневное, не привязано к роли | `["all"]` **или** один ключ *(вариант текста под шаблон)* |
| `profile` | сюжет **характерен для роли** | **только** конкретный ключ(и); **`all` запрещён** |
| `instrumental` | из состояния игры (актив, полис, подушка…) | обычно `["all"]`; при необходимости — ключ шаблона |
| `needs_risk` | риск/последствие при просадке потребностей | по оси + опционально ключ шаблона |
| `global` | макро/локальная экономика | **свой набор на шаблон** (не `all`) |

**Масштабирование (v2+):** заложить возможность «`content_class` + доп. instrumental prerequisites» без смены класса на `instrumental` — отдельный slice, не Pre-Alpha.

**Не путать:**

- **`audience_template_keys`** — **кому показывать** (фильтр пула), не «стилистика».
- **Стилизация текста** под Студента/Профессионала — **отдельные записи** с `content_class: universal` и `audience: [mq_game_basic_v1]`, либо (позже) `copy_variants` в metadata. Запись с `content_class: profile` — это **другой сюжет**, не «тот же ресторан другими словами».

### Разделение полей

| Поле | Слой | Назначение |
|------|------|------------|
| **`content_class`** | продукт | ровно одна природа (таблица выше) |
| **`event_slot`** | движок | очередь периода: choice / informational / needs_risk / chain / global |
| **`audience_template_keys`** | движок | фильтр шаблона: `["all"]` или `["mq_game_basic_v1", …]` |
| **`event_domain`** | тема | еда, авто, семья… |
| **`scenario_shape`** | форма | soft_offer, chain, asset_linked… |
| **`interaction_kind`** | UX | choice / informational / chain_followup |
| **`prerequisites_json`** | движок | инструменты, период, **не** заменяет content_class |
| **`mandatory_gate`** | движок | blocks_period_end |

### Слоты периода (`event_slot`)

| `event_slot` | Лимит / период | Считается в «2 игровых»? |
|--------------|----------------|---------------------------|
| `period_choice` | **2** | **да** |
| `informational` | **1** | **нет** |
| `needs_risk` | **0–1** (вероятность, см. §Needs risk) | **нет** |
| `chain_followup` | по расписанию цепочки | **нет** (как сейчас) |
| `global_macro` | **0–1** (планировщик) | **нет** |
| `intro` | вне периода / разово | **нет** |

**Порядок выдачи в начале периода (proposal):**

1. `ensure_scheduled_chain_events` → chain_followup  
2. `ensure_global_macro_event` (если due) → global_macro  
3. `ensure_needs_risk_event` (вероятностный roll) → needs_risk  
4. `ensure_informational_events` (триггеры / цепочки) → informational  
5. `ensure_period_choice_events` → добрать до 2 × period_choice  

Лимит `_period_pool_instance_count` **только** для `period_choice`.

### Аудитория (`audience_template_keys`)

JSON-массив в БД. Default для instrumental/universal — `["all"]`; для profile/global — **обязательно** конкретный ключ.

```python
def audience_matches(defn, profile) -> bool:
    keys = parse_json_array(defn.audience_template_keys) or ["all"]
    if "all" in keys:
        return True
    tk = profile.starter_template_key or ""
    return tk in keys

def validate_definition(defn) -> None:
    if defn.content_class == "profile" and "all" in parse_json_array(defn.audience_template_keys):
        raise ValueError("profile events cannot use audience all")
```

**Зачем:** события Студента не попадают Профессионалу. **Не** для подстановки текста — для **включения/исключения** записи из пула.

**«Стилизация» без `profile`:** две записи `universal` с разным `audience` и текстом (ресторан со студентами vs с коллегами) — это **два события**, не один `profile`.

---

## Needs risk — вероятность и «эпизод просадки»

**Не путать** с legacy `rescue_event_bias` (усиление веса в pool of 2) — целевое поведение: **отдельный слот** `needs_risk`, `content_class: needs_risk`.

### Порог

Ось считается «в зоне риска», если значение **&lt; 33%** шкалы (0–100).

### Выбор оси

Если ниже порога **несколько** осей — кандидаты = все такие оси; движок выбирает **одну** (вес по severity или random weighted).

### Вероятность (не мгновенно)

При каждой проверке (начало периода / после decay) для каждой оси в зоне риска, **если ещё не срабатывало в текущем эпизоде**:

```text
p = base × f(value)
f(value) растёт при падении value (чем ниже %, тем выше шанс)
```

Конкретная кривая `f` — в `needs.player_support` blueprint или константа в коде (tune в балансе).

### Один раз за эпизод просадки

Состояние на партию — таблица `event_profile_needs_risk_episodes` (proposal):

| Поле | Смысл |
|------|--------|
| `game_profile_id`, `axis` | ключ |
| `episode_active` | ось сейчас &lt; 33% |
| `fired_in_episode` | risk-событие по этой оси уже было в этом эпизоде |

**Переходы:**

1. Ось падает ниже 33% → `episode_active=true`, `fired_in_episode=false` (новый эпизод).
2. Roll успешен → выдать `needs_risk` по оси, `fired_in_episode=true`.
3. Ось поднимается **≥ 33%** → `episode_active=false`, `fired_in_episode=false` (сброс).
4. Снова падение ниже 33% → новый эпизод, снова **максимум одно** risk-событие за эпизод.

За один период — **не более 1** события в слоте `needs_risk` (даже если несколько осей в зоне).

---

## `prerequisites_json` v2 (инструменты)

Текущие ключи сохраняются. **Добавляем:**

| Ключ | Смысл |
|------|--------|
| `min_period_index` | не раньше N-го месяца |
| `max_period_index` | не позже (редко) |
| `min_safety_fund_ratio_of_target` | подушка ≥ доля от цели победы (0.5 = 50%) |
| `forbid_insurance_any` | **нет** полиса из списка `{product, insured_object}` |
| `requires_insurance_any` | **есть** полис (уже есть) |
| `active_liability_kinds_any` | *(future)* вид долга |
| `chain_branch_required` | *(future)* только если в `event_profile_chains.context` ветка X |

**Составное условие = AND** всех указанных блоков.

Пример «квартира + ипотека + нет страховки жилья» — см. §Examples.

---

## Global macro

| Поле | Пример |
|------|--------|
| `content_class` | `global` |
| `event_slot` | `global_macro` |
| `audience_template_keys` | `["mq_game_basic_v1"]` — **отдельные записи на шаблон** |
| `interaction_kind` | `informational` |
| `prerequisites_json.min_period_index` | 10 |
| `metadata_json.global_schedule` | `{ "min_periods_between": 10, "max_periods_between": 15 }` |

Планировщик на **`game_profile_id`** (партия): `last_global_macro_period_index`. **Новая игра** (новый `GameProfile`) — cooldown и история **с нуля**; тот же человек, другая партия — global снова возможен.

Эффекты первого инкремента: informational + опционально `economy_patch` stub.

---

## Informational — триггеры

Слот `informational`, `interaction_kind: informational`. Источники (не исчерпывающий список):

| Триггер | Пример |
|---------|--------|
| Цепочка | лотерея после отказа брату |
| Механика | первый открытый депозит, первый полис |
| Global | macro уже в слоте `global_macro` (может дублировать interaction_kind) |
| Период / tier | обучающая карточка на period 3 |

Не занимает 2 игровых слота `period_choice`.

---

## Цепочки (требование продукта)

1. Follow-up **обязан** содержать отсылку к выбору (шаблон текста + `context_json.branch`).
2. Поддержка **informational** follow-up (лотерея, «коллегу повысили»).
3. Счётчики веток (`loans_to_brother_count`) — через `event_profile_counters` или `context_json` на chain.

---

## Examples (каталог YAML → БД)

### A. Повседневное — вариант текста под Студента (не `profile`!)

```yaml
definition_key: mq11_restaurant_offer_student
content_class: universal              # сюжет «ресторан», не «роль студента»
event_slot: period_choice
audience_template_keys:
  - mq_game_basic_v1                  # фильтр: только эта запись у студента
event_domain: consumption
interaction_kind: choice
```

*(Отдельная запись `mq11_restaurant_offer_pro` с `audience: [mq_game_tight_budget_v1]` — тот же класс, другой текст.)*

### B. Профильное — только Профессионал

```yaml
definition_key: mq11_colleague_promotion_followup
content_class: profile
event_slot: informational
audience_template_keys:
  - mq_game_tight_budget_v1
event_domain: income_work
interaction_kind: informational
scenario_shape: chain
prerequisites:
  chain_branch_required:
    chain_key: evening_course_declined
    branch: declined
choices:
  - title: Понятно
    effects: {}
```

*(Реальный choose для informational — одна кнопка; effects пустые или needs_delta.)*

### C. Инструментальное — машина есть, полиса ОСАГО нет (уже близко к prod)

```yaml
definition_key: mq11_car_accident
content_class: instrumental
event_slot: period_choice
audience_template_keys:
  - all
event_domain: auto
scenario_shape: asset_linked
interaction_kind: choice
mandatory_gate: blocks_period_end
prerequisites:
  active_asset_kinds_any:
    - car_personal
  forbid_insurance_any:
    - product: auto
      insured_object: liability
```

### D. Инструментальное — жильё + долг + нет страховья (целевая v2)

```yaml
definition_key: mq11_home_water_damage_uninsured
content_class: instrumental
event_slot: period_choice
audience_template_keys:
  - all
event_domain: housing
scenario_shape: asset_linked
interaction_kind: choice
mandatory_gate: blocks_period_end
prerequisites:
  active_asset_kinds_any:
    - leased_dwelling
  min_active_liabilities: 1
  forbid_insurance_any:
    - product: property
      insured_object: dwelling
```

### E. Needs risk — отдельный слот, вероятность

```yaml
definition_key: mq11_risk_social_isolation
content_class: needs_risk
event_slot: needs_risk
audience_template_keys:
  - mq_game_basic_v1
event_domain: social_family
interaction_kind: choice
metadata:
  needs_risk_axes: [social]
```

*(Условие оси и roll — в движке + `event_profile_needs_risk_episodes`, не в prerequisites.)*

### F. Global macro — свой на шаблон

```yaml
definition_key: macro_rate_up_student
content_class: global
event_slot: global_macro
audience_template_keys:
  - mq_game_basic_v1
event_domain: credit_debt
interaction_kind: informational
prerequisites:
  min_period_index: 10
metadata:
  global_schedule:
    min_periods_between: 10
    max_periods_between: 15
```

---

## DTO: строка `event_definitions` (логическая)

```json
{
  "key": "mq11_car_accident",
  "mode": "game",
  "title": "ДТП",
  "content_class": "instrumental",
  "event_slot": "period_choice",
  "audience_template_keys": "[\"all\"]",
  "event_tier": 3,
  "mandatory_gate": "blocks_period_end",
  "prerequisites_json": "{\"active_asset_kinds_any\":[\"car_personal\"],\"forbid_insurance_any\":[{\"product\":\"auto\",\"insured_object\":\"liability\"}]}",
  "metadata_json": "{\"event_domain\":\"auto\",\"interaction_kind\":\"choice\",\"scenario_shape\":\"asset_linked\"}",
  "repeat_policy": "repeatable",
  "cooldown_periods": 6
}
```

## DTO: `GET /api/game/events/pending` (фрагмент)

```json
{
  "events": [
    {
      "id": 101,
      "definition_key": "mq11_family_money_callback",
      "event_slot": "chain_followup",
      "content_class": "profile",
      "interaction_kind": "chain_followup",
      "event_domain": "social_family",
      "chain_context": { "branch": "refused_once", "summary_ru": "Вы ранее отказали родственнику." },
      "choices": [ "..."]
    },
    {
      "id": 102,
      "definition_key": "macro_central_bank_rate_up",
      "event_slot": "global_macro",
      "content_class": "global",
      "interaction_kind": "informational",
      "choices": [{ "title": "Понятно", "effects": {} }]
    },
    {
      "id": 103,
      "definition_key": "mq11_groceries_discount",
      "event_slot": "period_choice",
      "content_class": "universal",
      "interaction_kind": "choice",
      "event_domain": "consumption",
      "choices": [ "..."]
    },
    {
      "id": 104,
      "definition_key": "mq11_evening_course",
      "event_slot": "period_choice",
      "content_class": "profile",
      "choices": [ "..."]
    }
  ],
  "period_slots_summary": {
    "period_choice": { "limit": 2, "pending": 2 },
    "informational": { "limit": 1, "pending": 1 },
    "needs_risk": { "limit": 1, "pending": 0 }
  }
}
```

---

## Balance (authoring)

Каждый choice соблюдает **закон trade-off** — см. [`event-choice-balance-tradeoffs.md`](../../vision/ideas/event-choice-balance-tradeoffs.md) и операционный чеклист [`.cursor/skills/create-event/event-balance-rules.md`](../../../.cursor/skills/create-event/event-balance-rules.md).

| Правило | Кратко |
|---------|--------|
| **Нет бесплатных needs+** | needs растут → cash− и/или burn+ и/или needs− на другой оси |
| **Отказ стоит** | soft_offer, cash≥0 → в большинстве случаев needs не растут; часто needs− |
| **Нет доминанта** | ни одна кнопка не лучше другой по cash **и** needs **и** burn одновременно |
| **needs_risk** | не «подарок» после просадки; платное смягчение или тяжёлый отказ |
| **Lifecycle §10** | downgrade/переезд: не голый `repeatable`; `once` / `max_per_profile` / cooldown ≥ 12; state ladder — [`event-repeat-and-state-ladder.md`](../../vision/ideas/event-repeat-and-state-ladder.md) |
| **Оси needs §11** | тема → главная ось (жильё→comfort, семья→social, …); brief `needs_axis_map` |

**Success (контент EVT1):** ревизия новых событий + `/event-analysis`: free-lunch scan + repeat/lifecycle + axis mismatch.

**Не в scope spec:** автоматический solver баланса в runtime.

### Автолинт (EVT1-106, prod)

**Scope pytest:** §1/§3 only (`free_lunch`, `pareto_dominates`, `xp_delta`). **§10 lifecycle** и **§11 needs_axis** — ручной аудит [`/event-analysis`](../../agents/EVENTS_AGENT.md) + [`EVENT_BRIEF.md`](../../templates/EVENT_BRIEF.md); массовая правка каталога — **EVT1-105**.

| Компонент | Назначение |
|-----------|------------|
| `backend/app/events/balance_contract.py` | §1/§3: `free_lunch`, `pareto_dominates`, запрет `xp_delta` |
| `tests/unit/events/test_event_balance_contract.py` | baseline **31** нарушения §1/§3 до EVT1-105 → **0** |
| `mvp11_contract.validate_mvp11_specs` | `xp_delta` в YAML → fail |

```bash
cd backend && python -m pytest tests/unit/events/test_event_balance_contract.py -q
cd backend && python -c "from app.events.balance_contract import validate_mvp11_balance; from app.events.mvp11_catalog import load_mvp11_catalog; v=validate_mvp11_balance(load_mvp11_catalog()[0]); print(len(v), v[:3])"
```

**Фазы:** (1) baseline gate §1/§3 — **сейчас**; (2) EVT1-105 ребаланс §1–4 + **§10 + §11** по всему каталогу; (3) optional lint §10 в CI; (4) fail on **new** keys only.

---

## Testing strategy

| ID | Сценарий |
|----|----------|
| CS-1 | Student-профиль: не выпадает событие с `audience: [mq_game_tight_budget_v1]` |
| CS-2 | После выдачи 2× period_choice + 1 informational счётчик period_choice **не** блокирует 3-е informational |
| CS-3 | Ось social &lt; 33%, roll OK, не fired_in_episode → 1 needs_risk; ось ≥33% → сброс; повторное падение → снова max 1 за эпизод |
| CS-4 | chain follow-up приходит с `chain_context` в API |
| CS-5 | period_index=12, due global на **этой партии** → 1 global_macro; новая партия — cooldown с нуля |
| CS-6 | Seed validator: `content_class=profile` + `audience all` → fail |
| CS-7 | YAML sample: no choice with needs+ sum &gt;0 and cash≥0 without burn (lint script or manual gate) |

Commands:

```bash
cd backend && python -m pytest -q tests/unit/events tests/integration/api/test_events_pending_contract.py
cd frontend-react && npm run test:utils
```

---

## Boundaries

- **Always:** whitelist effects; chain follow-up вне random pool; ADR-009 **2 choice** сохраняем для слота `period_choice`.
- **Ask first:** новые колонки БД; изменение `EVENTS_PER_PERIOD`; economy_patch от macro.
- **Never:** `profile` + `audience: all`; informational в pool of 2; instant needs_risk при первом tick &lt;33% без roll.

---

## Resolved (2026-05-30)

- [x] Needs risk: порог **33%** на любой оси; вероятность ↑ при падении; **1 раз за эпизод просадки** по оси; слот отдельный.
- [x] Global: **на партию** (`game_profile_id`); новая игра = сброс; каталог **per template**.
- [x] Informational: цепочки + **триггеры по механикам** и др.

## Open Questions

- [ ] Точная формула `p(axis_value)` для needs_risk (linear vs step).
- [ ] v2+: явный флаг «universal + instrumental prerequisites» в metadata.

---

## Verdict

**DRAFT v2 — уточнения продукта учтены.** После approve EVT1-001 → Plan.
