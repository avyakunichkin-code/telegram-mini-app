# Skill context check — 2026-05-28

Command: `node .cursor/skills/skill-test/_context-check.mjs`

## Summary

- **32** skills in catalog
- **32** COMPLIANT, **0** WARNINGS, **0** NON-COMPLIANT
- **SKILL_DOC_MAP:** PASS

## Scope

- `catalog.context` (`must_read`, `writes_to`, `next_skill`)
- «Прочитай сначала» in active/optional `SKILL.md`
- Pipeline skills in `docs/agents/SKILL_DOC_MAP.md`

## Behavioral specs updated

- `specs/build/incremental-implementation.md` — 3 cases + context case
- `specs/build/frontend-ui-engineering.md` — 3 cases + context case
- `specs/build/design-lab-mqx.md` — 3 cases + context case

## Usage

```bash
node .cursor/skills/skill-test/_context-check.mjs
```

Cursor: `/skill-test context all`
