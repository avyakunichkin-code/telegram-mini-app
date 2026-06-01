---
name: create-event
description: >-
  Creates and extends game events (EventDefinition seeds, choices, effects, chains).
  Use for /create-event or when adding scenarios for Student vs Professional personas,
  content_class, event_slot, audience, needs_risk, global macro, needs_delta, burn preview.
  Not a reviewer — co-author with checklists. Engine v2 fields — author in YAML; loader EVT1.
argument-hint: "[persona: student|professional, content_class, idea, or definition_key to clone]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Shell
---

# Create Event (/create-event)

Помощник **авторинга** событий ТВОЙ ХОД. Вызывай: **`/create-event`**, «создать событие», «informational для цепочки», «global для студента».

**Не путать с:** **`/event-analysis`** (read-only обзор) · `game-economy-and-victory` (движок слотов) · `economy-reviewer` (ревью diff).

> **2026-05-30:** канон типов — [`SPEC_event-system-v2-slots-and-taxonomy.md`](../../../docs/specs/features/SPEC_event-system-v2-slots-and-taxonomy.md). **EVT1-020 (taxonomy колонки + фильтр пула `period_choice`/audience)** — в prod. **EVT1-030 (multi-slot: informational / needs_risk / global_macro)** — отдельная задача; новые поля в YAML закладываем заранее.

## Прочитай сначала

- [`SPEC_event-system-v2-slots-and-taxonomy.md`](../../../docs/specs/features/SPEC_event-system-v2-slots-and-taxonomy.md) — **content_class, event_slot, audience, needs_risk, global**
- [`docs/handbook/EVENTS_TERMS_RU.md`](../../../docs/handbook/EVENTS_TERMS_RU.md) — «переводчик» для команды
- [`.cursor/skills/create-event/persona-profiles.md`](persona-profiles.md) — Студент / Профессионал, burn, needs
- [`docs/templates/EVENT_BRIEF.md`](../../../docs/templates/EVENT_BRIEF.md)
- [`data/events/mvp11/`](../../../data/events/mvp11/) — канон YAML
- [`data/events/README.md`](../../../data/events/README.md)
- [`docs/specs/features/SPEC_mvp-11-progression-events.md`](../../../docs/specs/features/SPEC_mvp-11-progression-events.md) — tier, pool (legacy 2 choice)
- [`docs/vision/ideas/event-engagement-anti-fatigue.md`](../../../docs/vision/ideas/event-engagement-anti-fatigue.md)
- [`docs/vision/ideas/event-repeat-and-state-ladder.md`](../../../docs/vision/ideas/event-repeat-and-state-ladder.md) — повтор, cooldown, лестница жилья/тарифа
- [`docs/vision/ideas/event-types-and-taxonomy.md`](../../../docs/vision/ideas/event-types-and-taxonomy.md)
- [`backend/app/events/constants.py`](../../../backend/app/events/constants.py) — `ALLOWED_EFFECT_KEYS`
- [`backend/app/events/choice_impacts.py`](../../../backend/app/events/choice_impacts.py) — burn preview
- [`.cursor/skills/create-event/event-balance-rules.md`](event-balance-rules.md) — **trade-off, Pareto, lifecycle §10, оси needs §11, MCE §12**
- [`docs/vision/ideas/event-choice-balance-tradeoffs.md`](../../../docs/vision/ideas/event-choice-balance-tradeoffs.md) — продуктовое обоснование
- **Эталон цепочки-«Истории»:** [`event-briefs/mq11_freelance_project_chain.md`](../../../docs/vision/ideas/event-briefs/mq11_freelance_project_chain.md) · `chains/freelance_project.yaml`

**Satellites:** `test-driven-development` (pytest); **после новой цепочки 3+ шагов** — **`/event-analysis`** (scope `chains` или `key` + §10/§11); перед merge всего каталога — scope **all**; UI informational → `design-lab-mqx`.

**Дальше:** `test-driven-development` (см. `catalog.yaml` → `next_skill`).

---

## Правила §10 (lifecycle) и §11 (оси needs) — обязательны

Полный текст: [`event-balance-rules.md`](event-balance-rules.md) §10–§11 · [`EVENT_BRIEF.md`](../../../docs/templates/EVENT_BRIEF.md) §1 (таблица A–D).

| § | В brief | В YAML |
|---|---------|--------|
| **10** | `lifecycle_class` A/B/C/D | `repeat_policy`, `cooldown_periods`, `repeat_max` |
| **11** | `needs_axis_map` | `needs_delta` по матрице домена |

**Перед записью housing/consumption с −lifestyle:** класс **B** или **A**, не голый `repeatable` без cooldown.

---

## Канон и БД ([ADR-008](../../../docs/decisions/ADR-008-events-catalog-single-source.md))

- **В git:** `data/events/mvp11/*.yaml` — массив `events:`; `catalog.yaml`.
- **Loader:** `backend/app/events/mvp11_catalog.py` — upsert через `mvp11_seeds.py`.
- **Не писать** контент в `migrations/*.sql`.
- После правки YAML — перезапуск backend; на prod — деплой.

---

## Модель события (обязательно при авторинге)

### 1. `content_class` — ровно одна «природа» (либо-либо)

| Значение | Когда выбирать | `audience_template_keys` |
|----------|----------------|---------------------------|
| `universal` | повседневное, не ролевой сюжет | `["all"]` **или** один ключ *(вариант текста)* |
| `profile` | сюжет **характерен для роли** (курсы, одногруппники) | **только** ключ(и) шаблона; **`all` запрещён** |
| `instrumental` | из состояния игры (машина, полис, подушка…) | обычно `["all"]` |
| `needs_risk` | риск при просадке потребностей &lt; 33% | по оси + опционально ключ |
| `global` | макро/локальная экономика | **отдельная запись на шаблон**, не `all` |

**Инварианты:**

- Одна запись = **один** `content_class` (не «профильное + по машине»; v2+ combo — позже).
- **`profile` + `audience: ["all"]`** — **ошибка автора**; валидатор EVT1 отклонит.
- **Не путать:** `audience` = **кому показывать** (фильтр), не «стилистика». Два текста под студента/про при одной механике → **две** записи `universal` с разным `audience`, не `profile`.

### 2. `event_slot` — очередь периода

| `event_slot` | Лимит | Заменяет 2 игровых choice? |
|--------------|-------|----------------------------|
| `period_choice` | 2 | да (это «обычные 2 события») |
| `informational` | 1 | **нет** |
| `needs_risk` | 1 (вероятностно) | **нет** |
| `chain_followup` | по цепочке | **нет** |
| `global_macro` | 1 (cooldown) | **нет** |

**По умолчанию** для soft_offer / mandatory / instrumental choice → `period_choice`.

### 3. YAML — целевые поля (top-level)

```yaml
definition_key: mq11_example
content_class: universal          # обязательно в новых событиях
event_slot: period_choice
audience_template_keys:
  - mq_game_basic_v1              # или [all] — см. таблицу выше
event_domain: consumption
scenario_shape: soft_offer
interaction_kind: choice
# prerequisites: { ... }           # instrumental / tier / period
# extra:                          # needs_risk_axes, global_schedule, …
#   needs_risk_axes: [social]
```

Пока loader не читает top-level `content_class` / `audience` / `event_slot` — **дублируй в `extra`** для `metadata_json` **и** оставь top-level для канона (EVT1 подхватит). Существующие события без полей — не трогать массово без `/event-analysis`.

**Prod сейчас:** loader требует **≥2 choices** даже для informational — временно: две кнопки («Понятно» / «Закрыть») или одна с дублем до правки loader (EVT1).

### 4. `needs_risk` (не legacy rescue bias)

- **`content_class: needs_risk`**, **`event_slot: needs_risk`**.
- **`extra.needs_risk_axes`:** `[social]` | `[health]` | …
- Триггер в движке (EVT1): ось &lt; 33%, **вероятность** ↑ при падении; **1 раз за эпизод просадки** по оси.
- **Не** смешивать с `extra.is_rescue` / `rescue_event_bias` в pool of 2 — legacy до EVT1-060.

### 5. `global`

- Отдельный key на шаблон: `macro_rate_up_student` / `macro_rate_up_pro`.
- `event_slot: global_macro`, `interaction_kind: informational`.
- `prerequisites.min_period_index: 10`, `extra.global_schedule: { min_periods_between: 10, max_periods_between: 15 }`.
- Cooldown **на партию** (`game_profile_id`); новая игра — сброс.

### 6. Informational

- `event_slot: informational`, `interaction_kind: informational`.
- Триггеры: цепочка (`enqueue_event`), механика (первый депозит), tier/period — в brief указать **источник**, не random pool of 2.

---

## Роль

Соавтор контента. Помогаешь:

1. Выбрать **content_class + event_slot + audience** (чеклист §Модель).
2. Не забыть tier, mode, taxonomy, **lifecycle class (§10)**, `repeat_policy`, `cooldown_periods`, `repeat_max`, prereq.
3. Копирайт и цифры под персону (persona-profiles).
4. Парные варианты — **разные keys**, правильный class (`universal` vs `profile`).
5. Цепочки с **отсылкой к прошлому выбору** в title/description follow-up.
6. Запись в `data/events/mvp11/` + pytest.

---

## Workflow

### 0. Уточни у пользователя (если не сказано)

- **Формат:** разовая карточка | **цепочка-«История»** (3–5 шагов, отдельные keys на ветки) — для истории см. §Эталон
- **content_class:** universal | profile | instrumental | needs_risk | global | informational-followup
- **event_slot:** period_choice | informational | needs_risk | chain_followup | global_macro
- Персона / **audience:** student (`mq_game_basic_v1`) | pro (`mq_game_tight_budget_v1`) | all
- Идея одним предложением
- Триггер (random pool | chain | needs | mechanic | global schedule)
- Для сырой сюжетной гипотезы без цифр → сначала **idea-refine**, затем brief

### 1. Event Brief

Заполни [`EVENT_BRIEF`](../../../docs/templates/EVENT_BRIEF.md): добавь строки **content_class**, **event_slot**, **audience**, **триггер**.

### 2. Образец

Ближайший event в `data/events/mvp11/` с тем же **content_class** и domain. Крупный scope → сначала **`/event-analysis`**.

### 3. Персона и audience (не prereq-hack)

| Персона | template_key | Класс / audience |
|---------|--------------|------------------|
| Студент | `mq_game_basic_v1` | profile → только этот key; universal skin → key + audience student |
| Профессионал | `mq_game_tight_budget_v1` | то же для pro |

**До EVT1-030 в prod:** multi-slot и needs_risk engine — **не** implement из этого скилла без явного запроса.

**Audience (EVT1-020 в prod):** пиши **`audience_template_keys`** в YAML; **`profile` + `all`** — ошибка (`validate_event_taxonomy`). Старый обход — `prerequisites_json` (car forbid/any) для instrumental.

**Instrumental «только про»:** `content_class: instrumental`, `audience: [all]`, prereq `car_personal` — не profile.

### 4. Effects и баланс

- Только `ALLOWED_EFFECT_KEYS`.
- **Обязательно:** [`event-balance-rules.md`](event-balance-rules.md):
  - §1–3: trade-off, отказ, Pareto;
  - §4: needs_risk;
  - §10: **lifecycle** — не бесконечный downgrade/переезд (`once` / `max_per_profile` / cooldown ≥ 12);
  - §11: **главная ось needs** по теме (жильё → comfort, семья → social, …);
  - §12: MCE — подсказка `cash` под целевой needs+ (ручная правка YAML).
- **`needs_delta`:** §11 + persona-profiles; в brief — `needs_axis_map`.
- **`repeat_policy` / `cooldown_periods`:** класс A/B/C из §10; см. [`event-repeat-and-state-ladder.md`](../../../docs/vision/ideas/event-repeat-and-state-ladder.md).
- **`cash_delta`:** % от salary; каждые +10 needs ≈ 3–8% salary или burn.
- Цепочки: `enqueue_event`, follow-up с отсылкой — [`event-catalog-qna-refine.md`](../../../docs/vision/ideas/event-catalog-qna-refine.md).

**Перед записью YAML:** мысленный тест «игрок жмёт только плюсы» и **«могу ли снова удешевить без сюжета»**; impacts по каждой кнопке (§6.1). **Нет `xp_delta`.**

### 5. Код (канон → БД)

1. Файл: domain / `chains/` / `meta/` (+ `catalog.yaml` includes)
2. Объект в `events:` со всеми полями §Модель
3. Опционально: `docs/vision/ideas/event-briefs/<key>.md`

### 6. Verify

```bash
cd backend && python -m pytest -q tests/unit/events/test_event_balance_contract.py tests/test_mvp11_yaml_catalog.py
cd backend && python -m pytest -q -k "event"
```

**Gate trade-off:** `validate_mvp11_balance` вызывается из `validate_mvp11_specs` — каталог с Pareto/free lunch **не проходит** `test_mvp11_yaml_loads_full_catalog`. После правок YAML — обязательно оба набора выше.

---

## Генерация пары Student / Professional

1. Общая механика → **`content_class: universal`** (если не ролевой сюжет) **или** **`profile`** (если разный сюжет).
2. Два key, два **`audience_template_keys`**, разный текст и sums.
3. **Не** один key с `audience: all` для «профильного» сюжета.

---

## Эталонная «История» (4+ шага) — `freelance_project`

Канон: [`data/events/mvp11/chains/freelance_project.yaml`](../../../data/events/mvp11/chains/freelance_project.yaml) · brief [`mq11_freelance_project_chain.md`](../../../docs/vision/ideas/event-briefs/mq11_freelance_project_chain.md) · тест [`test_freelance_project_chain.py`](../../../backend/tests/test_freelance_project_chain.py).

**7 keys:** `offer` → `midperiod` → (`deadline_rush` | `deadline_steady`) → (`epilogue_rush` | `epilogue_steady`). **Не путать** с разовым `mq11_part_time_job_student` (кафе, без цепочки).

| Паттерн | Как в эталоне |
|---------|----------------|
| **Педагогика** | Нерегулярный доход; аванс = обязательство; шаг 2 — trade-off needs **без спойлера** будущих ₽; игрок не знает «цены» отдыха vs работы |
| **Отдельный key на ветку UX** | `deadline_rush` vs `deadline_steady`; `epilogue_rush` vs `epilogue_steady` |
| **Скрытые кнопки** | `requires_chain_branch` **внутри `effects`** (не на уровне choice); дубли title для `advance` / `deferred` или `advance_grill` / `advance_grind` |
| **Контекст цепочки** | `payment`, `prep`, `branch` в `enqueue_event.context`; каждый `enqueue` **переносит** `payment`; шаг 3 фильтрует по полному `branch` |
| **Деньги** | Шаг 1: в тексте **остаток только после защиты**; аванс на кнопке; шаги 2–3 — **без cash**; эпилог — остаток; steady — +35% бонус; rush — без бонуса, ремарка про опечатки |
| **Отказ / срыв** | Отказ **только** на шаге 1; **нет** кнопки «сдаться» на дедлайне; **нет** автопровала |
| **Кнопки** | Шаг 2 — ровно **2**; шаг 3 — **2** (rush: сам / инструмент; steady: сдать / вычитать) |
| **Обязательность** | `mandatory_gate: blocks_period_end` на шагах 2–3 |
| **Informational** | `event_slot: informational`, ≥2 кнопки с лёгким trade-off needs (не дубли 0/0); урок — второй абзац `description` |
| **Тайминг** | `after_periods: 2` → `2` → `1` (периоды **N → N+2 → N+4 → N+5** от старта цепочки) |
| **Движок** | `chain_key: freelance_project`; `CHAIN_KEY_BY_DEFINITION` + `active_chain_context`; все follow-up в `CHAIN_FOLLOWUP_EXCLUDE_FROM_RANDOM_POOL`; цепочка `complete` на эпилоге |
| **Баланс** | Pareto не сравнивает пары с `requires_chain_branch` ([`event-balance-rules.md`](event-balance-rules.md) §3.1) |

**После записи:** `pytest` + **`/event-analysis`** scope `chains` или `key mq11_freelance_project_offer`.

Новая многошаговая история: копируй каркас; не смешивай rush/steady в одном `definition_key`.

---

## Чеклист перед записью

- [ ] `content_class` — один из пяти; **profile ≠ all**
- [ ] `event_slot` согласован с class (global → global_macro, …)
- [ ] `audience_template_keys` — фильтр, не стилистика
- [ ] `event_tier`, `mode: game`; lifecycle §10 (A/B/C/D + cooldown / repeat_max)
- [ ] instrumental → `prerequisites` (AND); не подменять profile
- [ ] needs_risk → axes в extra; не полагаться на rescue bias
- [ ] chain follow-up → отсылка к выбору в description
- [ ] **Цепочка-История:** отдельные keys на ветки; `requires_chain_branch` в `effects`; follow-up в exclude pool; mid/deadline mandatory при необходимости; cash только на согласованных шагах
- [ ] 2+ choices (prod loader); informational — ≥2 кнопки, не идентичные 0/0
- [ ] **Баланс:** trade-off §1, Pareto §3 (порядок choices не спасает), отказ §2, needs_risk §4, **needs_axis_map §11**
- [ ] `pytest tests/unit/events/test_event_balance_contract.py` — **0** violations (baseline)

---

## Согласование

Перед записью: **Могу записать** в `data/events/mvp11/` (и brief)?

Покажи **черновик** (class, slot, audience, title, кнопки) до Write.

---

## Verdict

| Verdict | Когда |
|---------|--------|
| **COMPLETE** | brief + YAML + pytest green |
| **CONCERNS** | YAML без pytest или без brief |
| **BLOCKED** | нужен EVT1 (audience filter / multi-slot / needs_risk engine) — опиши задачу, не кодируй движок |

---

## Следующий шаг

- Обзор каталога → `/event-analysis`
- Движок слотов → `game-economy-and-victory` + EVT1 в беклоге
- UI informational → `design-lab-mqx`
