---
status: draft
owner:
last_reviewed:
tracks:
idea:
plan:
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

Ref: [`foundation/TMA_USER_FLOWS.md`](../foundation/TMA_USER_FLOWS.md)

## Data & API

### Models / DB

- …

### Endpoints

| Method | Path | Request | Response | Notes |
|--------|------|---------|----------|-------|
| GET | `/api/…` | … | … | … |

Sync: `frontend-react/src/api.js`, `CLAUDE.md` if public contract changes.

## UI / UX

- Screens: …
- Ref: [`specs/SPEC_FRONTEND_UI.md`](../specs/SPEC_FRONTEND_UI.md)

## Rules & edge cases

- …

## Testing strategy

Skill: **`/critical-tests`** ([`critical-test-scenarios`](../../.cursor/skills/critical-test-scenarios/SKILL.md)).  
Цель — **не 100% coverage**, а критичные сценарии (gate G1–G4). Ref: [`backend/tests/README.md`](../../backend/tests/README.md).

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
