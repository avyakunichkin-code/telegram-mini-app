---
layer: task
epic_id: E1
phase: build
tier: core
skill: delivery
satellites:
  - verify-change
  - verify-change
read_if_when:
  - "progression / event_tier / pool"
next_skill: verify-change
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

- **Phase:** `build` — `define` | `build` | `verify` | `ship` (см. [`SKILL_DOC_MAP.md`](../agents/SKILL_DOC_MAP.md))
- **Scope:** продукт и стадия; tier — необязательные метаданные задачи, не runtime-каталог.
- **Skill:** `delivery` — один primary из `.agents/skills`, выбранный по description.
- **Satellites:** `verify-change` по риску; дополнительные роли — по правилам клиента.
- **Next skill:** `verify-change` — закрыть min gate G1–G4; затем `review-change`
- **Spec:** `specs/features/SPEC_<slug>.md` §…
- **Read if:** только контекст выбранного SKILL.md и затронутые spec/code; scripts для разрешения старого каталога не нужны.
- **Acceptance:** …
- **Critical scenarios:** CS-1 …, CS-2 … (skill `/verify-change`, gate G1–G4)
- **Verify:** `pytest …` / `npm run test:unit` / ручной сценарий из spec
- **Files:** `game/api/…`, `game/web/…`
- **Estimate:** S | M | L
- **Depends:** MQ-041

**Правило:** одна задача = один вертикальный срез; не больше ~5 файлов без согласования.

---

## Примеры `tier` + `skill` + `satellites`

| Срез | `tier` | `skill` | `satellites` |
|------|--------|---------|--------------|
| Новое событие в YAML | `core` | `event-authoring` | `verify-change`, `verify-change` |
| Обзор каталога | `core` | `event-audit` | — (при P1 → `event-authoring` в follow-up MQ) |
| Правка `period.py` / victory | `core` | `game-economy` | `verify-change`, `review-change` |
| Нарезка epic из spec | `support` | `delivery` | — |
| Ревью перед merge | `support` | `review-change` | — |
| ADR: кто владеет полем API | `support` | `architecture-decision` | `delivery` |
| Pre-release checklist | `deferred` | `delivery: release` | `review-change` |

`tier: deferred` в задаче — только если пользователь явно просит (release, perf, TMA runtime, …).
