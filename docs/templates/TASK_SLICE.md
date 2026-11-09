---
layer: task
epic_id: E1
phase: build
tier: core
skill: delivery
satellites:
  - verify-change
read_if_when:
  - "progression / event_tier / pool"
next_skill: review-change
spec: ../specs/features/SPEC_<slug>.md
plan: ../plans/PLAN_<slug>.md
traceability: ../TRACEABILITY.md
tags:
  - tvoy-hod/layer/task
  - tvoy-hod/layer/template
aliases:
  - E1
  - TASK_SLICE
---
### MQ-042 — Краткое название среза

- **Phase:** `build` — `define` | `build` | `verify` | `ship`
- **Tier:** `core` — область среза; не механизм автозагрузки
- **Skill:** `delivery` — один primary из [AGENTS.md](../../AGENTS.md)
- **Satellites:** `verify-change` — только проверки затронутого риска
- **Next skill:** `review-change` — отдельный review по необходимости
- **Spec:** `specs/features/SPEC_<slug>.md` §…
- **Read if:** открыть только относящиеся к срезу spec, код и справки из primary skill; маршруты — [CODEX-PROCESSES](../ai/CODEX-PROCESSES.md)
- **Acceptance:** …
- **Critical scenarios:** CS-1 …, CS-2 … (skill `$verify-change`, gate G1–G4)
- **Verify:** `pytest …` / `npm run test:unit` / ручной сценарий из spec
- **Files:** `backend/…`, `frontend-react/…`
- **Estimate:** S | M | L
- **Depends:** MQ-041

**Правило:** одна задача = один вертикальный срез; не больше ~5 файлов без согласования.

---

## Примеры `tier` + `skill` + `satellites`

| Срез | `tier` | `skill` | `satellites` |
|------|--------|---------|--------------|
| Новое событие в YAML | `core` | `event-authoring` | `verify-change` |
| Обзор каталога | `core` | `event-audit` | — (при P1 → `event-authoring` в follow-up MQ) |
| Правка `period.py` / victory | `core` | `game-economy` | `verify-change`, `balance-playtest` при существенном изменении |
| Нарезка epic из spec | `support` | `delivery` (plan) | — |
| Ревью перед merge | `support` | `review-change` | — |
| ADR: кто владеет полем API | `support` | `architecture-decision` | `delivery` |
| Pre-release checklist | `deferred` | `delivery` | `review-change` |

`tier: deferred` в задаче — только если пользователь явно просит (release, perf, TMA runtime, …).
