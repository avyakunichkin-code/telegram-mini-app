# Планы (`docs/plans/`)

**PLAN_*.md** — как строим фичу после утверждённой spec: граф зависимостей, вертикальные срезы, checkpoints.

## Шаблон

[`docs/templates/PLAN_FEATURE.md`](../templates/PLAN_FEATURE.md)

Обязательные поля frontmatter:

| Поле | Назначение |
|------|------------|
| `epic_id` | ID эпика в [`TRACEABILITY.md`](../TRACEABILITY.md) (`E1`, `M11`, …) |
| `spec` | Ссылка на `docs/specs/features/SPEC_*.md` |
| `next_skill` | Скилл после **APPROVED** плана (обычно `incremental-implementation`) |
| `traceability` | [`TRACEABILITY.md`](../TRACEABILITY.md) |

## Связь с агентом

| Phase в плане/задаче | Типичный Agent Skill |
|----------------------|----------------------|
| `define` | `planning-and-task-breakdown`, `api-and-interface-design` |
| `build` | `incremental-implementation`, `frontend-ui-engineering`, `design-lab-mqx` |
| `verify` | `test-driven-development`, `code-review-and-quality`, `browser-testing-with-devtools` |
| `ship` | `documentation-and-adrs`, `deprecation-and-migration` |

Карта: [`docs/agents/SKILL_DOC_MAP.md`](../agents/SKILL_DOC_MAP.md). Правило Cursor: `tvoy-hod-agent-skills-phase.mdc`.

## Задачи

Секция **Tasks** в том же `PLAN_*.md` или выгрузка в [`docs/tasks/`](../tasks/README.md).
