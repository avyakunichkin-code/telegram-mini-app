---
name: event-analysis
description: >-
  Read-only analysis of the MVP 1.1 event YAML catalog: content_class, event_slot,
  audience coverage, personas, chains, needs_risk/global gaps, balance hints.
  Use for /event-analysis or before large catalog changes. Does not edit YAML.
argument-hint: "[scope: all|domain|content_class|slot|persona|tier, optional definition_key]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Shell
---

# Event Analysis (/event-analysis)

**Read-only** обзор каталога. Вызов: **`/event-analysis`**, «пробелы по content_class», «хватает ли informational», «global для студента».

**Не путать с:**

| Инструмент | Когда |
|------------|--------|
| **`/create-event`** | писать / менять YAML |
| **`game-economy-and-victory`** | движок слотов, EVT1 implement |
| **`economy-reviewer`** | ревью diff перед merge |

**Мантра:** *Create пишет YAML · Analyze читает YAML · Reviewer судит diff.*

> **Канон типов (2026-05-30):** [`SPEC_event-system-v2-slots-and-taxonomy.md`](../../../docs/specs/features/SPEC_event-system-v2-slots-and-taxonomy.md), [`EVENTS_TERMS_RU.md`](../../../docs/handbook/EVENTS_TERMS_RU.md). Поля в YAML могут **опережать** prod loader — отмечай **authoring vs engine**.

## Прочитай сначала

- [`SPEC_event-system-v2-slots-and-taxonomy.md`](../../../docs/specs/features/SPEC_event-system-v2-slots-and-taxonomy.md)
- [`docs/handbook/EVENTS_TERMS_RU.md`](../../../docs/handbook/EVENTS_TERMS_RU.md)
- [`data/events/README.md`](../../../data/events/README.md)
- [`data/events/mvp11/catalog.yaml`](../../../data/events/mvp11/catalog.yaml)
- [`.cursor/skills/create-event/persona-profiles.md`](../create-event/persona-profiles.md)
- [`docs/specs/features/SPEC_mvp-11-progression-events.md`](../../../docs/specs/features/SPEC_mvp-11-progression-events.md)
- [`docs/vision/ideas/game-balance-thresholds-and-constraints.md`](../../../docs/vision/ideas/game-balance-thresholds-and-constraints.md)
- [`docs/vision/ideas/event-engagement-anti-fatigue.md`](../../../docs/vision/ideas/event-engagement-anti-fatigue.md)
- [`docs/vision/ideas/event-repeat-and-state-ladder.md`](../../../docs/vision/ideas/event-repeat-and-state-ladder.md)
- [`docs/templates/EVENT_CATALOG_ANALYSIS.md`](../../../docs/templates/EVENT_CATALOG_ANALYSIS.md)
- [ADR-008](../../../docs/decisions/ADR-008-events-catalog-single-source.md)
- [`docs/backlog/PRODUCT_BACKLOG.md`](../../../docs/backlog/PRODUCT_BACKLOG.md) — эпик **EVT1**
- [`.cursor/skills/create-event/event-balance-rules.md`](../create-event/event-balance-rules.md) — **аудит trade-off**
- [`docs/vision/ideas/event-choice-balance-tradeoffs.md`](../../../docs/vision/ideas/event-choice-balance-tradeoffs.md)

**Куда писать:** `docs/vision/analysis/` (сохранение отчёта — только по запросу).

**Satellites:** gaps с правками → **`/create-event`**; **EVT1-105** — scope **all** (§1–4 + **§10** + **§11**); merge diff → **`economy-reviewer`**.

**Дальше:** `create-event` (см. `catalog.yaml` → `next_skill`).

---

## Обязательные блоки отчёта (§10 / §11)

При scope **all**, **housing**, **consumption** — секции **Lifecycle (§10)** и **Axis (§11)** обязательны (шаблон [`EVENT_CATALOG_ANALYSIS.md`](../../../docs/templates/EVENT_CATALOG_ANALYSIS.md)). Без них verdict не выше **GAPS**.

---

## Режим

- **По умолчанию не писать файлы** — отчёт в чат.
- Сохранить отчёт — **только по запросу** пользователя.
- **Не менять** `data/events/mvp11/`, spec, беклог (если не просят).

---

## Workflow

### 0. Уточни scope

| Scope | Пример запроса |
|-------|----------------|
| **all** | весь mvp11 + EVT1 readiness |
| **content_class** | universal / profile / instrumental / needs_risk / global |
| **event_slot** | period_choice / informational / chain / global_macro |
| **domain** | один `event_domain` |
| **persona** | student / pro / пары / audience gaps |
| **tier** | event_tier 1 / 2 / 3+ |
| **key** | одно событие + соседи |
| **evt1** | готовность к demo α по таблице EVT1 в беклоге |

### 1. Собери факты

```bash
cd backend && python scripts/event_catalog_report.py
cd backend && python -m pytest -q -k "mvp11 or event_taxonomy or mq116" 2>nul
```

```bash
# content_class / audience / slot (если поля уже в YAML)
rg -n "content_class|event_slot|audience_template" data/events/mvp11/
rg -n "is_rescue|needs_risk" data/events/mvp11/
rg -n "interaction_kind: informational" data/events/mvp11/
rg -n "enqueue_event|chains/" data/events/mvp11/
```

```bash
cd backend && python -c "from app.events.mvp11_catalog import load_mvp11_catalog; s,t=load_mvp11_catalog(); print(len(s), 'events')"
```

### 2. Чеклист анализа

#### A. Контракт и EVT1 readiness

1. Число defs, tier, min choices; `validate_mvp11_specs` / mq116.
2. Сколько событий **размечены** `content_class` / `event_slot` / `audience_template_keys`.
3. **Нарушения канона (authoring):** `profile` + `all`; global с `all`; отсутствие class у новых briefs.
4. **Engine gap:** какие поля в YAML **не** читает `mvp11_catalog.py` / `ensure_period_events` — список для EVT1.

#### B. Покрытие по типам (demo α)

| content_class | Мин. ожидание (EVT1-100) | Факт count |
|---------------|--------------------------|------------|
| universal | 2+ на persona (или all) | … |
| profile | 2+ на persona | … |
| instrumental | 2+ (prereq разнообразие) | … |
| needs_risk | 1+ на persona / ось | … |
| global | 1+ **на шаблон** (stub) | … |

| event_slot | Ожидание | Факт |
|------------|----------|------|
| period_choice | bulk каталога | … |
| informational | 2–3 (цепочки + механики) | … |
| chain_followup | chains/ + exclude pool | … |
| needs_risk | отдельно от pool of 2 | … |
| global_macro | per-template | … |

#### C. Персоны и audience

- Keys с `audience: mq_game_basic_v1` vs `mq_game_tight_budget_v1` vs `all`.
- **Legacy proxy:** `forbid car` / `active car` vs явный audience.
- Пары `_student` / `_pro` для **universal** skin vs отдельные **profile** сюжеты.
- События, которые **должны** быть profile-only, но попадают всем через prereq-only.

#### D. Баланс выборов (trade-off) — **обязательный блок**

См. [`event-balance-rules.md`](../create-event/event-balance-rules.md) §1–4, §6.

1. **Free lunch scan:** choices с `needs_delta` &gt; 0 и `cash_delta >= 0` без burn — список keys (**CONCERNS** если много в tier-1 soft_offer).
2. **Отказ:** soft_offer с «не тратить» — есть ли needs− или только 0/0?
3. **Pareto:** в каждом событии с 3 choice — есть ли доминирующая кнопка?
4. **needs_risk / is_rescue:** «бесплатное» восстановление needs?
5. **% salary:** max \|cash\| vs 62.5k / 100k (persona-profiles).
6. **Рекомендация:** keys на `/create-event` ребаланс + brief `balance_notes`.
7. **Автолинт:** `pytest tests/unit/events/test_event_balance_contract.py` — сравнить с baseline 31; после EVT1-105 → 0.

```bash
rg "cash_delta: 0" data/events/mvp11/ -A8 | rg -B2 "needs_delta"
```

#### E. Повтор и lifecycle (§10) — **обязательный при scope all / housing / consumption**

См. [`event-repeat-and-state-ladder.md`](../../../docs/vision/ideas/event-repeat-and-state-ladder.md).

1. **`repeatable` без `cooldown_periods`** на defs с −`monthly_lifestyle_delta` / downgrade — список keys.
2. **Кандидаты на класс A:** сюжеты релокации, one-shot narrative (`mq11_relocation_bonus` и аналоги).
3. **Кандидаты на класс B:** `mq11_downsize_flat`, `mq11_home_internet` (ветка дешевле) — предложить `max_per_profile` + cooldown ≥ 12.
4. **Fatigue:** частые повторы одного key в симуляции — отсылка к `/balance-playtest` при наличии.
5. **Engine gap:** state ladder (класс C) — только brief, флаги EVT1.

```bash
rg "repeat_policy: repeatable" data/events/mvp11/ -B6
rg "monthly_lifestyle_delta: -" data/events/mvp11/ -B10
```

**CONCERNS:** ≥2 housing/consumption keys с бесконечной оптимизацией без плана EVT1-105.

#### F. Согласованность осей needs (§11)

1. **Axis mismatch:** `event_domain: housing` + сильный `health:`+ без health-темы — список.
2. **Тройной needs+** на tier-1 soft_offer — список.
3. Покрытие: social / health / comfort / status по доменам — таблица «домен → ожидаемая главная ось».

#### G. Цепочки

- offer + followup в `chains/`; follow-up **вне** random pool keys.
- Текст follow-up: отсылка к branch / прошлому выбору (да/нет/сумма).
- Informational follow-up (лотерея, коллега) — slot + trigger documented?

#### H. Needs (legacy rescue)

- Legacy `extra.is_rescue` / rescue bias vs целевой **`needs_risk`** class.

#### I. Global

- Записи per template; `min_period_index`; schedule metadata.
- Дубли macro между шаблонами (ожидаемо: разный текст, разный key).

#### J. Дубли и пробелы

- Близкие title/механика в одном domain.
- Gaps → brief + `/create-event`, приоритет 🔴/🟡 по EVT1.

### 3. Отчёт

Структура [`EVENT_CATALOG_ANALYSIS.md`](../../../docs/templates/EVENT_CATALOG_ANALYSIS.md):

- Executive summary (3–5 буллетов)
- Таблицы по scope (в т.ч. **content_class × persona**)
- **EVT1 readiness:** authoring ok / engine missing
- Gaps → «`/create-event` + brief?»
- Risks → economy-reviewer после правок

**Не выдавать** правки YAML как согласованные — только рекомendations.

---

## Verdict

| Verdict | Смысл |
|---------|--------|
| **HEALTHY** | контракт ок; критичных дыр по scope нет |
| **GAPS** | пробелы по class/slot/persona; играбельно |
| **CONCERNS** | profile+all, дисбаланс trade-off, бесконечный repeat/downgrade, axis mismatch, legacy без migration |
| **BLOCKED** | validate/pytest падает |

---

## Handoff

| Следующий шаг | Инструмент |
|---------------|------------|
| Добавить / исправить событие | `/create-event` |
| Движок audience / multi-slot | EVT1 / `game-economy-and-victory` |
| PR с YAML | `economy-reviewer` |
| UI informational | `design-lab-mqx` |
