---
status: draft
owner:
last_reviewed:
spec:
---

# Plan: [Feature name]

**Spec:** [`specs/features/SPEC_….md`](../specs/features/SPEC_….md)

## Summary

One paragraph: what we build in what order.

## Dependency graph

```text
DB / migrations
  └── models
        └── API routers
              └── api.js + hooks
                    └── UI components
```

## Vertical slices

1. Slice 1 — … (end-to-end testable)
2. Slice 2 — …

## Risks & mitigations

| Risk | Mitigation |
|------|------------|
| … | … |

## Checkpoints

- [ ] Spec approved
- [ ] Slice 1 done + verified
- [ ] Slice 2 done + verified
- [ ] Spec status → `implemented`

## Tasks

### MQ-001 — [Title]

- **Acceptance:** …
- **Verify:** …
- **Files:** …
- **Estimate:** S | M | L
- **Depends:** —

### MQ-002 — [Title]

- **Acceptance:** …
- **Verify:** …
- **Files:** …
- **Estimate:** …
- **Depends:** MQ-001
