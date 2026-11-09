---
tags:
  - tvoy-hod/layer/task
aliases:
  - "Задачи (`docs/game/tasks/`)"
---
# Инженерные задачи (`docs/game/tasks/`)

**Задачи владельца ТВОЕГО ХОДА:** [страница](index.html) · [карточки](README.md). Отдельный продукт [ТВОЙ ПЛАН](../../plan/tasks/index.html) имеет свой каталог.

Срез 07.11.2026: старые незакрытые чекбоксы E1/DL1 не доказывают отсутствие реализации. Сначала сверить остаток с code/spec.

Опциональная выгрузка MQ-* для трекера. **Канон** — секция **Tasks** в `docs/plans/PLAN_<feature>.md`; файл `TASKS_<slug>.md` — когда нужен отдельный чеклист или импорт в Linear/Jira.

## Шаблон среза

[`docs/templates/TASK_SLICE.md`](../../templates/TASK_SLICE.md)

## Поле `phase` (обязательно в каждой задаче)

Агент выбирает **Agent Skill** по phase, не по догадке:

| `phase` | Когда | Agent Skill (типично) |
|---------|--------|------------------------|
| `define` | Spec, контракт, нарезка плана | `delivery`, `api-contract-change`, `architecture-decision` |
| `build` | Код, UI, design-lab | `frontend-implementation`, `mqx-design`, `game-economy`, `event-authoring` |
| `verify` | Тесты, ревью, браузер | `verify-change`, `review-change`, `balance-playtest`; браузер — Playwright |
| `ship` | ADR, миграции, посты | `delivery`, `architecture-decision`; deferred release/marketing только по явной задаче |

В каждой задаче также укажи **`skill`** (кто ведёт срез) и **`next_skill`** (что после done).

## Frontmatter файла `TASKS_*.md`

```yaml
---
layer: tasks
epic_id: E1
spec: ../../specs/features/SPEC_<slug>.md
plan: ../plans/PLAN_<slug>.md
traceability: ../../TRACEABILITY.md
---
```

## Пример в чате (для пользователя)

```text
phase: build
skill: frontend-implementation
Задача: MQ-042 из PLAN_expenses — E1-115 burn + breakdown
```

См. [`DOCUMENTATION_SYSTEM.md`](../../DOCUMENTATION_SYSTEM.md) §4 фазы 2–3, [`TRACEABILITY.md`](../../TRACEABILITY.md).
