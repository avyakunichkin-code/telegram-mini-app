---
status: accepted
date: 2026-05-29
deciders: продукт + агентный конвейер (/create-event)
---

# ADR-008: Единый канон каталога событий (git → БД)

## Context

Каталог `EventDefinition` / `EventChoice` попадал в prod несколькими путями:

- идемпотентные сиды в Python (`mvp11_seeds.py`);
- исторические `INSERT` в `backend/migrations/*event*.sql`;
- редкие ручные правки в БД.

Это дублирование, путаница для агентов («писать в сиды или в SQL?») и риск расхождения prod с репозиторием.

**Рантайм** по-прежнему читает **PostgreSQL**; инстансы партии (`event_instances`) — отдельная сущность, не каталог.

## Decision

### 1. Канон контента (MVP 1.1)

**Git-источник:** [`data/events/mvp11/`](../../data/events/mvp11/) — YAML по доменам, массив `events:` в каждом файле.

- Оглавление: `catalog.yaml` (`includes:`).
- Домены: `consumption.yaml`, `health.yaml`, `social_family.yaml`, …
- Особые: `chains/*.yaml` (цепочки), `meta/*.yaml` (intro).
- Один `definition_key` на вариант; taxonomy (`event_domain`, `scenario_shape`, `extra`) — в том же объекте события, без дубля `EVENT_TAXONOMY` в Python.

**Загрузчик:** [`backend/app/events/mvp11_catalog.py`](../../backend/app/events/mvp11_catalog.py) — читает YAML **один раз на процесс** (кэш в памяти; после правки YAML — перезапуск backend).

**Синхронизация в БД:** [`backend/app/events/mvp11_seeds.py`](../../backend/app/events/mvp11_seeds.py) — `ensure_mvp11_event_catalog()`: upsert по ключу, сравнение полей с YAML; быстрый выход, если каталог уже в sync.

### 2. Миграции SQL

Только **схема**; **не добавлять** новые `INSERT` контента событий (legacy не трогать без отдельной задачи).

### 3. Агентский процесс

| Задача | Скилл |
|--------|--------|
| Authoring | **`create-event`** (`/create-event`): опциональный brief → YAML → `pytest -k event` |
| Read-only обзор | **`event-analysis`** (`/event-analysis`): отчёт, gaps; см. [`EVENTS_AGENT.md`](../agents/EVENTS_AGENT.md) |
| Ревью diff | **`economy-reviewer`** (subagent) |

**Brief** (`docs/vision/ideas/event-briefs/`) — **не обязателен** для loader’а; рекомендуется для новых событий, цепочек и спорного баланса. В YAML можно сослаться комментарием `# brief: …`.

### 4. Персоны

До `audience_json` в prod: отдельные `definition_key` + `prerequisites` (Студент / Профессионал).

## Consequences

- Навигация по домену, без монолита на тысячи строк.
- Правки существующих keys подтягиваются в БД после деплоя/рестарта (не только новые keys).
- `pyyaml` в backend dependencies.
- Экспорт legacy Python → YAML: `backend/scripts/export_mvp11_to_yaml.py` (сервисный).

## Связанные документы

- [`data/events/README.md`](../../data/events/README.md)
- [`docs/agents/EVENTS_AGENT.md`](../agents/EVENTS_AGENT.md)
- [`docs/specs/features/SPEC_mvp-11-progression-events.md`](../specs/features/SPEC_mvp-11-progression-events.md)
- [`backend/migrations/README.md`](../../backend/migrations/README.md)
