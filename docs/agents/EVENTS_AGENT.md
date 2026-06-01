# Агент событий (ТВОЙ ХОД)

## Три инструмента

| Задача | Вызов | Роль | Пишет в git? |
|--------|--------|------|----------------|
| **Создать / изменить событие** | **`/create-event`** | Соавтор: brief, YAML, pytest | да (`data/events/mvp11/`) |
| **Разобрать каталог** | **`/event-analysis`** | Read-only: gaps, **§1–4 + §10 + §11**, персоны, chains | нет (отчёт в чат или `docs/vision/analysis/` по запросу) |
| **Ревью PR / diff** | **`economy-reviewer`** | Корректность, pytest gate | нет |

**Мантра:** *Create пишет YAML · Analyze читает YAML · Reviewer судит diff.*

## Канон каталога ([ADR-008](../decisions/ADR-008-events-catalog-single-source.md))

```text
git: data/events/mvp11/*.yaml  →  mvp11_catalog.load  →  ensure_mvp11_event_catalog()  →  PostgreSQL
```

См. [`data/events/README.md`](../../data/events/README.md).

## Баланс событий (authoring)

| Слой | Документ | Что проверяет |
|------|----------|---------------|
| **Операционный канон** | [`.cursor/skills/create-event/event-balance-rules.md`](../../.cursor/skills/create-event/event-balance-rules.md) | §1–4 trade-off; **§10 lifecycle**; **§11 needs_axis_map**; §12 MCE |
| **Продукт** | [`event-choice-balance-tradeoffs.md`](../vision/ideas/event-choice-balance-tradeoffs.md) | Зачем нет free lunch |
| **Повтор / downgrade** | [`event-repeat-and-state-ladder.md`](../vision/ideas/event-repeat-and-state-ladder.md) | Классы A–D, плейтест |
| **Spec v2 (draft)** | [`SPEC_event-system-v2-slots-and-taxonomy.md`](../specs/features/SPEC_event-system-v2-slots-and-taxonomy.md) | Слоты + Balance |
| **Автолинт** | `balance_contract.py` + pytest | **Только** §1/§3 (free lunch, Pareto, `xp_delta`) |
| **Brief** | [`EVENT_BRIEF.md`](../templates/EVENT_BRIEF.md) | `lifecycle_class` → YAML repeat/cooldown |

**EVT1-105:** ребаланс всего каталога по §1–4 **и** §10–11 (`/event-analysis` scope **all**).

## Персоны (Game)

| UI | `template_key` | События сейчас |
|----|----------------|----------------|
| Студент | `mq_game_basic_v1` | Отдельные keys + prereq; см. `persona-profiles.md` |
| Профессионал | `mq_game_tight_budget_v1` | То же; тон и суммы выше |

**Фаза 2 (не в prod):** `audience_template_keys` — фильтр пула ([`SPEC_event-system-v2`](../specs/features/SPEC_event-system-v2-slots-and-taxonomy.md)).

## Конвейеры

### Authoring

```text
Идея → EVENT_BRIEF (lifecycle_class, needs_axis_map) → /create-event → data/events/mvp11/*.yaml → pytest -k event
```

### Analysis (перед крупным расширением или EVT1-105)

```text
/event-analysis scope all
  → trade-off (§1–4) + lifecycle (§10) + axis (§11)
  → EVENT_CATALOG_ANALYSIS template
         ↓ при P1 gaps
/create-event
```

### Merge

```text
PR с data/events/ или backend/app/events/ → economy-reviewer → pytest (balance_contract + mq116)
```

## Связанные артефакты

| Артефакт | Путь |
|----------|------|
| Create skill | [`.cursor/skills/create-event/`](../../.cursor/skills/create-event/) |
| Analysis skill | [`.cursor/skills/event-analysis/`](../../.cursor/skills/event-analysis/) |
| Balance rules | [`.cursor/skills/create-event/event-balance-rules.md`](../../.cursor/skills/create-event/event-balance-rules.md) |
| Brief | [`docs/templates/EVENT_BRIEF.md`](../templates/EVENT_BRIEF.md) |
| Отчёт анализа | [`docs/templates/EVENT_CATALOG_ANALYSIS.md`](../templates/EVENT_CATALOG_ANALYSIS.md) |
| Handbook (продукт) | [`handbook/EVENTS.md`](../handbook/EVENTS.md) |
| Handbook (термины) | [`handbook/EVENTS_TERMS_RU.md`](../handbook/EVENTS_TERMS_RU.md) |
| Сводка CLI | [`backend/scripts/event_catalog_report.py`](../../backend/scripts/event_catalog_report.py) |
| Spec M11 | [`SPEC_mvp-11-progression-events`](../specs/features/SPEC_mvp-11-progression-events.md) |
| Spec v2 (draft) | [`SPEC_event-system-v2-slots-and-taxonomy`](../specs/features/SPEC_event-system-v2-slots-and-taxonomy.md) |
| Rule (globs) | [`.cursor/rules/tvoy-hod-events.mdc`](../../.cursor/rules/tvoy-hod-events.mdc) |
