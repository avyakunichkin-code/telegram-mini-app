---
name: planning-and-task-breakdown
description: Breaks work into ordered tasks. Use when you have a spec or clear requirements and need to break work into implementable tasks. Use when a task feels too large to start, when you need to estimate scope, or when parallel work is possible.
argument-hint: "[spec path or feature name]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write
---

# Planning and Task Breakdown

## Прочитай сначала (ТВОЙ ХОД)

- [`docs/DOCUMENTATION_SYSTEM.md`](../../../docs/DOCUMENTATION_SYSTEM.md)
- [`docs/specs/features/`](../../../docs/specs/features/)
- [`docs/foundation/SPEC_PRODUCT.md`](../../../docs/foundation/SPEC_PRODUCT.md)
- [`docs/TRACEABILITY.md`](../../../docs/TRACEABILITY.md)
- [`docs/templates/PLAN_FEATURE.md`](../../../docs/templates/PLAN_FEATURE.md)
- [`docs/templates/TASK_SLICE.md`](../../../docs/templates/TASK_SLICE.md)
- [`docs/agents/SKILL_DOC_MAP.md`](../../../docs/agents/SKILL_DOC_MAP.md)

**Куда писать:** `docs/plans/`, `docs/tasks/`, строка эпика в `TRACEABILITY.md`. **Дальше:** `incremental-implementation`.

## Overview

Decompose work into small, verifiable tasks with explicit acceptance criteria. Good task breakdown is the difference between an agent that completes work reliably and one that produces a tangled mess. Every task should be small enough to implement, test, and verify in a single focused session.

## When to Use

- You have a spec and need to break it into implementable units
- A task feels too large or vague to start
- Work needs to be parallelized across multiple agents or sessions
- You need to communicate scope to a human
- The implementation order isn't obvious

**When NOT to use:** Single-file changes with obvious scope, or when the spec already contains well-defined tasks.

## The Planning Process

### Step 1: Enter Plan Mode

Before writing any code, operate in read-only mode:

- Read the spec and relevant codebase sections
- Identify existing patterns and conventions
- Map dependencies between components
- Note risks and unknowns

**Do NOT write code during planning.** The output is a plan document, not implementation.

### Step 1b: Привязка к эпику (ТВОЙ ХОД)

1. Найди или согласуй **epic ID** (`E1`, `M11`, …) в [`docs/TRACEABILITY.md`](../../../docs/TRACEABILITY.md).
2. Создай/обнови `docs/plans/PLAN_<slug>.md` по [`docs/templates/PLAN_FEATURE.md`](../../../docs/templates/PLAN_FEATURE.md):
   - frontmatter: `epic_id`, `spec`, `next_skill: incremental-implementation`
   - таблица **Vertical slices** с колонками Phase / Skill / Next skill
3. Каждая задача MQ-* — по [`docs/templates/TASK_SLICE.md`](../../../docs/templates/TASK_SLICE.md):
   - **`phase`:** `define` | `build` | `verify` | `ship`
   - **`skill`:** один доменный Agent Skill на срез
   - **`next_skill`:** что после done (часто `test-driven-development` для `build`)
4. Маппинг phase → skill: [`docs/agents/SKILL_DOC_MAP.md`](../../../docs/agents/SKILL_DOC_MAP.md).

### Step 2: Identify the Dependency Graph

Map what depends on what:

```
Database schema
    │
    ├── API models/types
    │       │
    │       ├── API endpoints
    │       │       │
    │       │       └── Frontend API client
    │       │               │
    │       │               └── UI components
    │       │
    │       └── Validation logic
    │
    └── Seed data / migrations
```

Implementation order follows the dependency graph bottom-up: build foundations first.

### Step 3: Slice Vertically

Instead of building all the database, then all the API, then all the UI — build one complete feature path at a time:

**Bad (horizontal slicing):**
```
Task 1: Build entire database schema
Task 2: Build all API endpoints
Task 3: Build all UI components
Task 4: Connect everything
```

**Good (vertical slicing):**
```
Task 1: User can create an account (schema + API + UI for registration)
Task 2: User can log in (auth schema + API + UI for login)
Task 3: User can create a task (task schema + API + UI for creation)
Task 4: User can view task list (query + API + UI for list view)
```

Each vertical slice delivers working, testable functionality.

### Step 4: Write Tasks

Each task follows this structure:

```markdown
## Task [N]: [Short descriptive title]

**Description:** One paragraph explaining what this task accomplishes.

**Acceptance criteria:**
- [ ] [Specific, testable condition]
- [ ] [Specific, testable condition]

**Verification:**
- [ ] Tests pass: `npm test -- --grep "feature-name"`
- [ ] Build succeeds: `npm run build`
- [ ] Manual check: [description of what to verify]

**Dependencies:** [Task numbers this depends on, or "None"]

**Files likely touched:**
- `src/path/to/file.ts`
- `tests/path/to/test.ts`

**Estimated scope:** [Small: 1-2 files | Medium: 3-5 files | Large: 5+ files]
```

### Step 5: Order and Checkpoint

Arrange tasks so that:

1. Dependencies are satisfied (build foundation first)
2. Each task leaves the system in a working state
3. Verification checkpoints occur after every 2-3 tasks
4. High-risk tasks are early (fail fast)

Add explicit checkpoints:

```markdown
## Checkpoint: After Tasks 1-3
- [ ] All tests pass
- [ ] Application builds without errors
- [ ] Core user flow works end-to-end
- [ ] Review with human before proceeding
```

## Task Sizing Guidelines

| Size | Files | Scope | Example |
|------|-------|-------|---------|
| **XS** | 1 | Single function or config change | Add a validation rule |
| **S** | 1-2 | One component or endpoint | Add a new API endpoint |
| **M** | 3-5 | One feature slice | User registration flow |
| **L** | 5-8 | Multi-component feature | Search with filtering and pagination |
| **XL** | 8+ | **Too large — break it down further** | — |

If a task is L or larger, it should be broken into smaller tasks. An agent performs best on S and M tasks.

**When to break a task down further:**
- It would take more than one focused session (roughly 2+ hours of agent work)
- You cannot describe the acceptance criteria in 3 or fewer bullet points
- It touches two or more independent subsystems (e.g., auth and billing)
- You find yourself writing "and" in the task title (a sign it is two tasks)

## Plan Document Template

```markdown
# Implementation Plan: [Feature/Project Name]

## Overview
[One paragraph summary of what we're building]

## Architecture Decisions
- [Key decision 1 and rationale]
- [Key decision 2 and rationale]

## Task List

### Phase 1: Foundation
- [ ] Task 1: ...
- [ ] Task 2: ...

### Checkpoint: Foundation
- [ ] Tests pass, builds clean

### Phase 2: Core Features
- [ ] Task 3: ...
- [ ] Task 4: ...

### Checkpoint: Core Features
- [ ] End-to-end flow works

### Phase 3: Polish
- [ ] Task 5: ...
- [ ] Task 6: ...

### Checkpoint: Complete
- [ ] All acceptance criteria met
- [ ] Ready for review

## Risks and Mitigations
| Risk | Impact | Mitigation |
|------|--------|------------|
| [Risk] | [High/Med/Low] | [Strategy] |

## Open Questions
- [Question needing human input]
```

## Parallelization Opportunities

When multiple agents or sessions are available:

- **Safe to parallelize:** Independent feature slices, tests for already-implemented features, documentation
- **Must be sequential:** Database migrations, shared state changes, dependency chains
- **Needs coordination:** Features that share an API contract (define the contract first, then parallelize)

## Common Rationalizations

| Rationalization | Reality |
|---|---|
| "I'll figure it out as I go" | That's how you end up with a tangled mess and rework. 10 minutes of planning saves hours. |
| "The tasks are obvious" | Write them down anyway. Explicit tasks surface hidden dependencies and forgotten edge cases. |
| "Planning is overhead" | Planning is the task. Implementation without a plan is just typing. |
| "I can hold it all in my head" | Context windows are finite. Written plans survive session boundaries and compaction. |

## Red Flags

- Starting implementation without a written task list
- Tasks that say "implement the feature" without acceptance criteria
- No verification steps in the plan
- All tasks are XL-sized
- No checkpoints between tasks
- Dependency order isn't considered

## Verification

Before starting implementation, confirm:

- [ ] Every task has acceptance criteria
- [ ] Every task has a verification step
- [ ] Every task has **`phase`**, **`skill`**, **`next_skill`**
- [ ] Task dependencies are identified and ordered correctly
- [ ] No task touches more than ~5 files
- [ ] Checkpoints exist between major phases
- [ ] [`TRACEABILITY.md`](../../../docs/TRACEABILITY.md) — колонка **Plan** у эпика указывает на этот `PLAN_*.md`
- [ ] The human has reviewed and approved the plan

---

## Gate (Human reviews)

**Do not advance** к `incremental-implementation`, пока человек не просмотрел и не утвердил план задач (явное «ок» / **APPROVED**). Без gate — только черновик в чате.

## Итог (Verdict)

В конце работы явно укажи результат: **PASS**, **FAIL**, **CONCERNS**, **COMPLETE** или **APPROVED** — в зависимости от типа задачи.

## Согласование изменений

Перед созданием или изменением файлов в репозитории спроси: «Могу записать …?» — если пользователь не дал явное «делай» / «запиши».

## Следующий шаг

`incremental-implementation` по списку задач.

