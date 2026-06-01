# Skill Test Coverage Audit

**Date:** 2026-05-31  
**Mode:** audit  
**Catalog:** `.cursor/skills/catalog.yaml`

## Summary

| Metric | Value |
|--------|-------|
| Skills in catalog | 40 |
| SKILL.md on disk | 40 (29 active + 11 archived) |
| Spec files | 40/40 (100%) |
| Static tests (before this run) | 37 COMPLIANT, 2 PENDING, 1 pending |
| Spec tests (`last_spec`) | 0 — field not set for any skill |
| Category tests (`last_category`) | 0 |
| Context tests (`last_context`) | 0 |
| Agents in catalog | 3 (no spec paths) |

**Skill coverage:** 40/40 specs (100%)  
**Agent coverage:** 0/3 behavioral specs

## Top priority gaps (pre-static)

1. No behavioral spec tests run for any skill.
2. Static PENDING on `balance-playtest`, `project-handbook-documentation`; lowercase `pending` on `event-analysis`.
3. Context integration never recorded (`last_context`).
4. Category rubric never run (`last_category`).
5. Agents (`economy-reviewer`, `economy-balance-runner`, `mqx-ui-reviewer`) without spec entries.

## Recommended follow-up

- `/skill-test static all` — run 2026-05-31 (see `skill-test-static-all-2026-05-31.md`)
- `/skill-test context all`
- `/skill-test spec create-event` (first core behavioral pass)
- `/skill-test category all`
