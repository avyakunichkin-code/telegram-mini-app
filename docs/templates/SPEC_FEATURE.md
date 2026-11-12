---
status: draft
owner:
last_reviewed:
tracks:
idea:
plan:
# tags + aliases — после сохранения: node scripts/docs/obsidian-enrich.mjs
tags:
  - tvoy-hod/layer/template
  - tvoy-hod/status/draft
aliases:
  - "[Feature name]"
  - "SPEC FEATURE"
  - SPEC_FEATURE
  - "Spec: [Feature name]"
---
# Spec: [Feature name]

## Assumptions

1. …
2. …
→ Correct before implementation.

## Objective

**Why:** …  
**Who:** …  
**Success criteria:**

- [ ] …
- [ ] …

## Scope

### In scope

- …

### Out of scope

- …

## User flows

| Step | Actor | Result |
|------|-------|--------|
| 1 | … | … |

Ref: [`foundation/TMA_USER_FLOWS.md`](../../game/docs/foundation/TMA_USER_FLOWS.md)

## Data & API

### Models / DB

- …

### Endpoints

| Method | Path | Request | Response | Notes |
|--------|------|---------|----------|-------|
| GET | `/api/…` | … | … | … |

Sync: `game/web/src/api.js`, `AGENTS.md` if public contract changes.

## UI / UX

- Screens: …
- Ref: [`specs/SPEC_FRONTEND_UI.md`](../../game/docs/specs/SPEC_FRONTEND_UI.md)

## Rules & edge cases

- …

## Testing strategy

Skill: **`/critical-test-scenarios`** ([`critical-test-scenarios`](../../.agents/skills/verify-change/SKILL.md)).\
Цель — **не 100% coverage**, а критичные сценарии (gate G1–G4). Ref: [`game/api/tests/README.md`](../../game/api/tests/README.md).

| Layer | What to prove |
|-------|----------------|
| Unit | … |
| API / integration | … |
| FE contract | … |
| Manual TMA | … |

### Critical scenarios (min gate)

| ID | Scenario | Layer | Command / path |
|----|----------|-------|----------------|
| CS-1 | Happy path: … | integration | `pytest tests/integration/…` |
| CS-2 | Boundary / contract: … | unit | `pytest tests/unit/…` |

Commands:

```bash
# backend
pytest …

# frontend
cd frontend-react && npm run build
```

## Boundaries

- **Always:** …
- **Ask first:** migrations, new deps, breaking API
- **Never:** …

## Open questions

| # | Question | Owner | Resolution |
|---|----------|-------|------------|
| 1 | … | … | … |

## Traceability

| Artifact | Link |
|----------|------|
| Idea | `vision/ideas/…` |
| Plan | `plans/PLAN_….md` |
| Backlog | `backlog/PRODUCT_BACKLOG.md` §… |
