# Skill Category Check: All Skills

**Date:** 2026-05-31  
**Mode:** category all  
**Rubric:** `.cursor/skills/quality-rubric.md`  
**Script:** `.cursor/skills/skill-test/_category-check.mjs`

## Summary

**38 COMPLIANT, 2 WARNINGS, 0 NON-COMPLIANT** (40 skills)

## By category

| Category | Skills | COMPLIANT | WARNINGS |
|----------|--------|-----------|----------|
| api | 1 | 1 | 0 |
| build | 11 | 11 | 0 |
| define | 3 | 3 | 0 |
| meta | 3 | 3 | 0 |
| review | 2 | 2 | 0 |
| ship | 5 | 5 | 0 |
| studio | 11 | 11 | 0 |
| verify | 6 | 4 | 2 |

## Warnings (2)

| Skill | Category | Metrics |
|-------|----------|---------|
| balance-playtest | verify | V1 evidence-based; V2 safety |
| telegram-mini-app-runtime | verify | V2 safety |

Heuristic gaps (скиллы по сути OK): добавить явные формулировки «evidence/измерения» и «security/осторожно в WebView».

## Script fixes (this run)

- `_category-check.mjs`: archived skills path; parser stops before `agents:` block.

## Next steps

- Fix 2 WARNINGS in SKILL.md (optional)
- `/skill-test spec create-event` — behavioral pass
