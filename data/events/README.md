# Каталог событий (git → PostgreSQL)

Канон контента MVP 1.1: **`data/events/mvp11/`**. Рантайм читает БД; синхронизация — `ensure_mvp11_event_catalog()` при API.

См. [ADR-008](../docs/decisions/ADR-008-events-catalog-single-source.md).

## Структура

```text
mvp11/
  catalog.yaml          # манифест includes
  consumption.yaml      # events: [ ... ]
  health.yaml
  social_family.yaml
  chains/               # связанные definition_key
  meta/                 # intro, разовые подсказки
```

## Добавить событие

1. Выбрать domain-файл (или `chains/`, `meta/`).
2. Добавить элемент в массив `events:` (поле `definition_key` уникально в каталоге).
3. `cd backend && python -m pytest -q -k event`
4. Перезапустить backend (YAML кэшируется при старте процесса).

Шаблон полей — [`docs/templates/EVENT_BRIEF.md`](../docs/templates/EVENT_BRIEF.md). Brief в `docs/vision/ideas/event-briefs/` **опционален**; желателен для новых событий, цепочек и спорного баланса.

## Разобрать каталог (без правок)

- **`/event-analysis`** — read-only отчёт: [`EVENTS_AGENT.md`](../docs/agents/EVENTS_AGENT.md)
- CLI: `cd backend && python scripts/event_catalog_report.py`

## Именование

`mq11_<domain>_<slug>` — отдельный key на вариант (Студент / Профессионал = разные keys + `prerequisites`).

## Не сюда

- SQL `INSERT` контента событий в миграциях
- правки только в БД без YAML
