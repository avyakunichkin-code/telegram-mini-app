---
layer: task
epic_id: E1
phase: build
tier: core
skill: incremental-implementation
satellites:
  - test-driven-development
next_skill: test-driven-development
spec: ../specs/features/SPEC_<slug>.md
plan: ../plans/PLAN_<slug>.md
traceability: ../TRACEABILITY.md
---

### MQ-042 — Краткое название среза

- **Phase:** `build` — `define` | `build` | `verify` | `ship` (см. [`SKILL_DOC_MAP.md`](../agents/SKILL_DOC_MAP.md))
- **Tier:** `core` — `core` | `support` | `deferred` | `meta` | `archived` (см. [`SKILLS_PHASE_CONTENT_AND_DATA.md`](../agents/SKILLS_PHASE_CONTENT_AND_DATA.md), [`catalog.yaml`](../../.cursor/skills/catalog.yaml))
- **Skill:** `incremental-implementation` — primary Agent Skill для среза (`tier` скилла в каталоге должен совпадать или быть `support`, если задача явно про plan/review/ADR)
- **Satellites:** `test-driven-development` — открыть в **той же** сессии до «done» (см. `.cursor/rules/tvoy-hod-router.mdc` → Primary + satellites)
- **Next skill:** `test-driven-development` — типичный следующий шаг после закрытия MQ-* (может совпадать с единственным satellite)
- **Spec:** `specs/features/SPEC_<slug>.md` §…
- **Acceptance:** …
- **Verify:** `pytest …` / `npm run check:guardrails` / ручной сценарий из spec
- **Files:** `backend/…`, `frontend-react/…`
- **Estimate:** S | M | L
- **Depends:** MQ-041

**Правило:** одна задача = один вертикальный срез; не больше ~5 файлов без согласования.

---

## Примеры `tier` + `skill` + `satellites`

| Срез | `tier` | `skill` | `satellites` |
|------|--------|---------|--------------|
| Новое событие в YAML | `core` | `create-event` | `test-driven-development` |
| Обзор каталога | `core` | `event-analysis` | — (при P1 → `create-event` в follow-up MQ) |
| Правка `period.py` / victory | `core` | `game-economy-and-victory` | `test-driven-development`, `doubt-driven-development` |
| Нарезка epic из spec | `support` | `planning-and-task-breakdown` | — |
| Ревью перед merge | `support` | `code-review-and-quality` | — |
| ADR: кто владеет полем API | `support` | `documentation-and-adrs` | `spec-driven-development` |
| Pre-release checklist | `deferred` | `release-tma` | `code-review-and-quality` |

`tier: deferred` в задаче — только если пользователь явно просит (release, perf, TMA runtime, …).
