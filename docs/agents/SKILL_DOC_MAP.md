# Карта: фаза → скилл → документы (ТВОЙ ХОД)

Машиночитаемый дубль — поле `context:` и **`tier`** в [`.cursor/skills/catalog.yaml`](../../.cursor/skills/catalog.yaml).  
Фаза «контент и данные»: [`SKILLS_PHASE_CONTENT_AND_DATA.md`](SKILLS_PHASE_CONTENT_AND_DATA.md).

## Конвейер документации

```text
docs/vision/ideas/     idea-refine
        ↓
docs/specs/features/   spec-driven-development
        ↓
docs/plans/ + tasks/   planning-and-task-breakdown
        ↓
backend/ + frontend/   incremental-implementation + test-driven-development
        ↓
review                 code-review-and-quality
        ↓
release (optional)     release-tma
```

## События (контент)

```text
идея / brief (опц.)  →  create-event (/create-event)  →  data/events/mvp11/*.yaml  →  pytest -k event
```

```text
обзор / gaps / баланс каталога  →  event-analysis (/event-analysis)  →  отчёт (read-only)
        ↓ при P1 gaps
create-event
```

Персоны: [`create-event/persona-profiles.md`](../../.cursor/skills/create-event/persona-profiles.md).  
Карта: [`EVENTS_AGENT.md`](EVENTS_AGENT.md).

## Игровая экономика (параллельно или вместо generic incremental)

```text
spec / баланс / period / victory  →  game-economy-and-victory
        ↓ satellites
test-driven-development + doubt-driven-development + balance-playtest (крупный diff)
        ↓
cd backend && python scripts/balance_playtest.py  →  docs/balance/reports/
        ↓
economy-reviewer + economy-balance-runner (subagents)
        ↓
code-review-and-quality
```

Ключевые файлы: `backend/app/game/period.py`, `backend/app/victory/engine.py`, [`SPEC_victory-v2`](../specs/features/SPEC_victory-v2.md).

## UI / MQX (параллельно spec, после утверждения макета)

```text
design-lab/<theme>/    design-lab-mqx  →  mqx/ + prod   frontend-ui-engineering
```

Канон процесса: [`frontend-react/src/components/mqx/DESIGN_WORKFLOW.md`](../../frontend-react/src/components/mqx/DESIGN_WORKFLOW.md).  
Навигация lab (хаб / round / parity): [`DESIGN_LAB_NAVIGATION.md`](DESIGN_LAB_NAVIGATION.md).

## API

```text
контракт в spec/чате  →  api-and-interface-design  →  routers + api.js  →  incremental-implementation
```

## `phase` + `tier` в задаче (MQ-* / чат)

| phase | `tier: core` (primary) | `tier: support` | `tier: deferred` |
|-------|------------------------|-----------------|------------------|
| `define` | `idea-refine`, `spec-driven-development`, `api-and-interface-design` | `planning-and-task-breakdown` | `context-engineering` |
| `build` | `incremental-implementation`, `create-event`, `event-analysis`, `game-economy-and-victory`, `design-lab-mqx`, `frontend-ui-engineering`, `test-driven-development` | — | `code-simplification` |
| `verify` | `test-driven-development` | `code-review-and-quality` | `browser-testing-with-devtools`, `doubt-driven-development`, `performance-optimization`, `security-and-hardening`, `telegram-mini-app-runtime` |
| `ship` | — | `documentation-and-adrs` | `deprecation-and-migration`, `social-changelog-posts`, `release-tma` |

**Satellites** — в YAML/frontmatter задачи (`satellites:`), не отдельный `tier`. Пример: `game-economy-and-victory` + `doubt-driven-development`.

Шаблоны: [`docs/templates/TASK_SLICE.md`](../templates/TASK_SLICE.md) (`tier`, `skill`, `satellites`), [`docs/templates/PLAN_FEATURE.md`](../templates/PLAN_FEATURE.md).

## Мета

| Задача | Скилл | Читать |
|--------|-------|--------|
| Какой скилл выбрать | `using-agent-skills` | `CURSOR_SKILLS.md`, `catalog.yaml` |
| Rules vs skills | `context-engineering` | `DOCUMENTATION_SYSTEM.md` |
| Линт скиллов | `skill-test` | `catalog.yaml`, `quality-rubric.md` |

## Источники правды (при конфликте)

1. Код + тесты (production)
2. `docs/specs/features/SPEC_*.md`
3. `docs/foundation/SPEC_PRODUCT.md`
4. `docs/vision/ideas/` — направление, не детали реализации

См. [`docs/DOCUMENTATION_SYSTEM.md`](../DOCUMENTATION_SYSTEM.md).
