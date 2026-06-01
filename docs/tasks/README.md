# Задачи (`docs/tasks/`)

Опциональная выгрузка MQ-* для трекера. **Канон** — секция **Tasks** в `docs/plans/PLAN_<feature>.md`; файл `TASKS_<slug>.md` — когда нужен отдельный чеклист или импорт в Linear/Jira.

## Шаблон среза

[`docs/templates/TASK_SLICE.md`](../templates/TASK_SLICE.md)

## Поле `phase` (обязательно в каждой задаче)

Агент выбирает **Agent Skill** по phase, не по догадке:

| `phase` | Когда | Agent Skill (типично) |
|---------|--------|------------------------|
| `define` | Spec, контракт, нарезка плана | `spec-driven-development`, `planning-and-task-breakdown`, `api-and-interface-design` |
| `build` | Код, UI, design-lab | `incremental-implementation`, `frontend-ui-engineering`, `design-lab-mqx` |
| `verify` | Тесты, ревью, браузер | `test-driven-development`, `code-review-and-quality`, `browser-testing-with-devtools` |
| `ship` | ADR, миграции, посты | `documentation-and-adrs`, `deprecation-and-migration`, `social-changelog-posts` |

В каждой задаче также укажи **`skill`** (кто ведёт срез) и **`next_skill`** (что после done).

## Frontmatter файла `TASKS_*.md`

```yaml
---
layer: tasks
epic_id: E1
spec: ../specs/features/SPEC_<slug>.md
plan: ../plans/PLAN_<slug>.md
traceability: ../TRACEABILITY.md
---
```

## Пример в чате (для пользователя)

```text
phase: build
skill: incremental-implementation
Задача: MQ-042 из PLAN_expenses — E1-115 burn + breakdown
```

См. [`DOCUMENTATION_SYSTEM.md`](../DOCUMENTATION_SYSTEM.md) §4 фазы 2–3, [`TRACEABILITY.md`](../TRACEABILITY.md).
