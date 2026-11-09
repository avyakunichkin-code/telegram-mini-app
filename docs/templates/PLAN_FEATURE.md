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
next_skill: delivery
tags:
  - tvoy-hod/layer/plan
  - tvoy-hod/layer/template
  - tvoy-hod/status/draft
aliases:
  - "[Feature name]"
  - E1
  - "PLAN FEATURE"
  - PLAN_FEATURE
  - "Plan: [Feature name]"
---
# Plan: [Feature name]

**Epic ID:** `E1` (строка в [`TRACEABILITY.md`](../TRACEABILITY.md))  
**Spec:** [`specs/features/SPEC_<slug>.md`](../specs/features/SPEC_<slug>.md)  
**После утверждения плана:** Agent Skill **`delivery`** (срезы по задачам ниже).

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

| # | Срез | Phase | Tier | Skill | Satellites | Read if (`when`) | Next skill |
|---|------|-------|------|-------|------------|------------------|------------|
| 1 | … end-to-end | `build` | `core` | `delivery` | `verify-change` | — | `verify-change` |
| 2 | UI / MQX | `build` | `core` | `mqx-design` → `frontend-implementation` | — | `lab parity / canon` | `review-change` |
| 3 | Контракт API | `define` | `core` | `api-contract-change` | `verify-change` | `breaking API change` | `delivery` |
| 4 | События YAML | `build` | `core` | `event-authoring` | `verify-change` | — |

`tier` / satellites: [`TASK_SLICE.md`](TASK_SLICE.md), [маршруты Codex](../../AGENTS.md).

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
Выгрузка в трекер (опционально): `docs/game/tasks/TASKS_<slug>.md`.

### MQ-001 — [Title]

- **Phase:** `build`
- **Tier:** `core`
- **Skill:** `delivery`
- **Satellites:** `verify-change`
- **Next skill:** `verify-change`
- **Spec:** … §…
- **Acceptance:** …
- **Verify:** …
- **Files:** …
- **Estimate:** S | M | L
- **Depends:** —
