# Агент событий (ТВОЙ ХОД)

## Три инструмента

| Задача | Вызов | Роль | Пишет в git? |
|--------|--------|------|----------------|
| **Создать / изменить событие** | **`/create-event`** | Соавтор: brief, YAML, pytest | да (`data/events/mvp11/`) |
| **Разобрать каталог** | **`/event-analysis`** | Read-only: gaps, баланс, персоны, chains | нет (отчёт в чат или `docs/vision/analysis/` по запросу) |
| **Ревью PR / diff** | **`economy-reviewer`** | Корректность, pytest gate | нет |

**Мантра:** *Create пишет YAML · Analyze читает YAML · Reviewer судит diff.*

## Канон каталога ([ADR-008](../decisions/ADR-008-events-catalog-single-source.md))

```text
git: data/events/mvp11/*.yaml  →  mvp11_catalog.load  →  ensure_mvp11_event_catalog()  →  PostgreSQL
```

См. [`data/events/README.md`](../../data/events/README.md).

## Персоны (Game)

| UI | `template_key` | События сейчас |
|----|----------------|----------------|
| Студент | `mq_game_basic_v1` | Отдельные keys + prereq; см. `persona-profiles.md` |
| Профессионал | `mq_game_tight_budget_v1` | То же; тон и суммы выше |

**Фаза 2 (не в prod):** `audience_json` — фильтр пула по шаблону ([architecture § Фаза 2](../architecture/architecture.md)).

## Конвейеры

### Authoring

```text
Идея → EVENT_BRIEF (опц.) → /create-event → data/events/mvp11/*.yaml → pytest -k event
```

### Analysis (перед крупным расширением каталога)

```text
/event-analysis → event_catalog_report.py + чеклист → отчёт (EVENT_CATALOG_ANALYSIS)
         ↓ при P1 gaps
/create-event
```

### Merge

```text
PR с data/events/ или backend/app/events/ → economy-reviewer → pytest
```

## Связанные артефакты

| Артефакт | Путь |
|----------|------|
| Create skill | [`.cursor/skills/create-event/`](../../.cursor/skills/create-event/) |
| Analysis skill | [`.cursor/skills/event-analysis/`](../../.cursor/skills/event-analysis/) |
| Brief | [`docs/templates/EVENT_BRIEF.md`](../templates/EVENT_BRIEF.md) |
| Отчёт анализа | [`docs/templates/EVENT_CATALOG_ANALYSIS.md`](../templates/EVENT_CATALOG_ANALYSIS.md) |
| Сводка CLI | [`backend/scripts/event_catalog_report.py`](../../backend/scripts/event_catalog_report.py) |
| Spec | [`SPEC_mvp-11-progression-events`](../specs/features/SPEC_mvp-11-progression-events.md) |
| Rule | `tvoy-hod-events.mdc` |
