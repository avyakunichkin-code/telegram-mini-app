---
name: event-analysis
description: >-
  Read-only analysis of the MVP 1.1 event YAML catalog: coverage, personas, balance
  hints, chains, gaps. Use for /event-analysis or before large catalog changes.
  Does not edit YAML — use create-event to author.
argument-hint: "[scope: all|domain|tier|persona, optional definition_key]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Shell
---

# Event Analysis (/event-analysis)

**Read-only** обзор каталога событий. Вызов: **`/event-analysis`**, «разбери события», «что не хватает для студента», «баланс tier 1».

**Не путать с:**

| Инструмент | Когда |
|------------|--------|
| **`/create-event`** | писать / менять YAML |
| **`economy-reviewer`** | ревью **diff** перед merge (код + pytest) |
| **`game-economy-and-victory`** | движок пула, `period.py`, victory |

**Мантра:** *Create пишет YAML · Analyze читает YAML · Reviewer судит diff.*

## Прочитай сначала

- [`data/events/README.md`](../../../data/events/README.md)
- [`data/events/mvp11/catalog.yaml`](../../../data/events/mvp11/catalog.yaml)
- [`.cursor/skills/create-event/persona-profiles.md`](../create-event/persona-profiles.md) — salary, needs, prereq
- [`docs/specs/features/SPEC_mvp-11-progression-events.md`](../../../docs/specs/features/SPEC_mvp-11-progression-events.md)
- [`docs/vision/ideas/game-balance-thresholds-and-constraints.md`](../../../docs/vision/ideas/game-balance-thresholds-and-constraints.md)
- [`docs/vision/ideas/event-engagement-anti-fatigue.md`](../../../docs/vision/ideas/event-engagement-anti-fatigue.md)
- [`docs/templates/EVENT_CATALOG_ANALYSIS.md`](../../../docs/templates/EVENT_CATALOG_ANALYSIS.md) — формат отчёта
- [ADR-008](../../../docs/decisions/ADR-008-events-catalog-single-source.md)

**Satellites:** после крупных выводов с правками → **`/create-event`**; перед merge diff каталога → **`economy-reviewer`**.

## Режим

- **По умолчанию не писать файлы** — отчёт в чат.
- Сохранить в `docs/vision/analysis/event-catalog-<topic>-<YYYY-MM-DD>.md` — **только если пользователь просит**.
- **Не менять** `data/events/mvp11/` (ни YAML, ни «мелкие фиксы»).

---

## Workflow

### 0. Уточни scope (если не сказано)

- **all** — весь каталог mvp11
- **domain** — один `event_domain` (consumption, social_family, …)
- **tier** — event_tier 1 / 2 / 3+
- **persona** — student | professional | gaps между парами
- **key** — одно событие + соседи по домену

### 1. Собери факты (детерминированно)

```bash
cd backend && python scripts/event_catalog_report.py
cd backend && python -m pytest -q app/events/mvp11_contract.py 2>nul || python -m pytest -q tests/test_mq116_acceptance.py -k validate
```

Плюс `rg` по `data/events/mvp11/` для domain/tier/prereq.

Загрузка (опционально в Shell):

```bash
cd backend && python -c "from app.events.mvp11_catalog import load_mvp11_catalog; s,t=load_mvp11_catalog(); print(len(s), 'events')"
```

### 2. Чеклист анализа

1. **Контракт spec** — число defs, tier 1 / 2–3 / 4+, min choices; что говорит `validate_mvp11_specs` / mq116.
2. **Покрытие доменов** — таблица domain → count; пустые / перегруженные домены.
3. **Персоны** — keys с `forbid car` (студент), `active car` (про), **пары** (`_student` / `_pro`), одиночки без пары.
4. **Баланс-ориентиры** (не «нравится»): `cash_delta` как % от salary (62.5k / 100k из persona-profiles); отказ = 0 ₽ где soft_offer.
5. **Пул** — weight, cooldown, `is_active: 0`, rescue (`extra.is_rescue`), chains (offer + followup в `chains/`).
6. **Дубли** — близкие title/механика/суммы в одном domain.
7. **Пробелы** — идеи для brief (без записи в YAML), приоритет P1/P2.

### 3. Отчёт

Заполни структуру из [`EVENT_CATALOG_ANALYSIS.md`](../../../docs/templates/EVENT_CATALOG_ANALYSIS.md):

- Executive summary (3–5 буллетов)
- Таблицы по запросу scope
- Gaps → «рекомендуется `/create-event` + brief?»
- Risks → «нужен economy-reviewer после правок»

**Не выдавать** правки YAML как будто уже согласованы — только рекомендации.

---

## Verdict

| Verdict | Смысл |
|---------|--------|
| **HEALTHY** | контракт ок, критичных дыр нет |
| **GAPS** | есть пробелы, каталог играбелен |
| **CONCERNS** | дисбаланс / дубли / нарушение spec — нужны правки |
| **BLOCKED** | validate/pytest падает — сначала починить каталог |

---

## Handoff

| Следующий шаг | Инструмент |
|---------------|------------|
| Добавить / исправить событие | `/create-event` |
| Правки движка пула | `game-economy-and-victory` |
| PR с изменениями YAML | `economy-reviewer` |
| UI карточки | `design-lab-mqx` |
