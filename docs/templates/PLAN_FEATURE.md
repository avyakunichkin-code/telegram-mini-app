---
layer: plan
epic_id: E1
phase: define
status: draft
owner:
last_reviewed:
spec: ../specs/features/SPEC_<slug>.md
idea: ../vision/ideas/<slug>.md
tasks: ../tasks/TASKS_<slug>.md
traceability: ../TRACEABILITY.md
next_skill: incremental-implementation
---

# Plan: [Feature name]

**Epic ID:** `E1` (строка в [`TRACEABILITY.md`](../TRACEABILITY.md))  
**Spec:** [`specs/features/SPEC_<slug>.md`](../specs/features/SPEC_<slug>.md)  
**После утверждения плана:** Agent Skill **`incremental-implementation`** (срезы по задачам ниже).

## Summary

Один абзац: что строим и в каком порядке (вертикальные срезы).

## Dependency graph

```text
DB / migrations
  └── models
        └── API routers
              └── api.js + hooks
                    └── UI components
```

## Vertical slices

| # | Срез | Phase | Tier | Skill | Satellites | Next skill |
|---|------|-------|------|-------|------------|------------|
| 1 | … end-to-end | `build` | `core` | `incremental-implementation` | `test-driven-development` | `test-driven-development` |
| 2 | UI / MQX | `build` | `core` | `design-lab-mqx` → `frontend-ui-engineering` | — | `code-review-and-quality` |
| 3 | Контракт API | `define` | `core` | `api-and-interface-design` | `test-driven-development` | `incremental-implementation` |
| 4 | События YAML | `build` | `core` | `create-event` | `test-driven-development` | — |

`tier` / satellites: [`TASK_SLICE.md`](TASK_SLICE.md), [`SKILLS_PHASE_CONTENT_AND_DATA.md`](../agents/SKILLS_PHASE_CONTENT_AND_DATA.md).

## Risks & mitigations

| Risk | Mitigation |
|------|------------|
| … | … |

## Checkpoints

- [ ] Spec **approved**
- [ ] Строка в `TRACEABILITY.md` (Plan колонка) обновлена
- [ ] Slice 1 done + verified
- [ ] Slice 2 done + verified
- [ ] Spec status → `implemented`; backlog `[x]`

## Tasks

Шаблон одной задачи: [`TASK_SLICE.md`](TASK_SLICE.md).  
Выгрузка в трекер (опционально): `docs/tasks/TASKS_<slug>.md`.

### MQ-001 — [Title]

- **Phase:** `build`
- **Tier:** `core`
- **Skill:** `incremental-implementation`
- **Satellites:** `test-driven-development`
- **Next skill:** `test-driven-development`
- **Spec:** … §…
- **Acceptance:** …
- **Verify:** …
- **Files:** …
- **Estimate:** S | M | L
- **Depends:** —
