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

1. Заполнить [`docs/templates/EVENT_BRIEF.md`](../docs/templates/EVENT_BRIEF.md) — **`lifecycle_class` (§10)**, **`needs_axis_map` (§11)**.
2. Выбрать domain-файл (или `chains/`, `meta/`).
3. Добавить элемент в массив `events:` (`definition_key` уникален).
4. `repeat_policy` / `cooldown_periods` / `repeat_max` — по таблице lifecycle в brief.
5. `cd backend && python -m pytest -q -k event`
6. Перезапустить backend (YAML кэшируется при старте).

**Баланс:** [`.cursor/skills/create-event/event-balance-rules.md`](../.cursor/skills/create-event/event-balance-rules.md) · [`EVENTS_AGENT.md`](../docs/agents/EVENTS_AGENT.md)

Brief в `docs/vision/ideas/event-briefs/` **опционален**; **обязателен** для downgrade/housing, цепочек и спорного trade-off.

## Разобрать каталог (без правок)

- **`/event-analysis`** scope **all** — trade-off + **§10 lifecycle** + **§11 axis** — [`EVENTS_AGENT.md`](../docs/agents/EVENTS_AGENT.md)
- Шаблон отчёта: [`EVENT_CATALOG_ANALYSIS.md`](../docs/templates/EVENT_CATALOG_ANALYSIS.md)
- CLI: `cd backend && python scripts/event_catalog_report.py`

## Именование

`mq11_<domain>_<slug>` — отдельный key на вариант (Студент / Профессионал = разные keys + `prerequisites`).

## Не сюда

- SQL `INSERT` контента событий в миграциях
- правки только в БД без YAML
