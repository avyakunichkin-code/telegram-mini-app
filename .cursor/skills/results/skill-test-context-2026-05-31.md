# Skill Context Check: All Skills

**Date:** 2026-05-31  
**Mode:** context all  
**Script:** `.cursor/skills/skill-test/_context-check.mjs`  
**Catalog:** `.cursor/skills/catalog.yaml`  
**Map:** `docs/agents/SKILL_DOC_MAP.md`

## Summary (initial run)

**38 COMPLIANT, 6 WARNINGS, 0 NON-COMPLIANT**

## Summary (after fixes, re-run)

**44 COMPLIANT, 0 WARNINGS, 0 NON-COMPLIANT**

**SKILL_DOC_MAP:** PASS (pipeline skills + catalog ref)

## Fixes applied

| Skill | Change |
|-------|--------|
| balance-playtest | **Дальше:** `game-economy-and-victory`, `test-driven-development` в «Прочитай» |
| create-event | Полный путь `event-balance-rules.md` в «Прочитай»; **Дальше:** `test-driven-development` |
| event-analysis | **Куда писать:** `docs/vision/analysis/`; **Дальше:** `create-event` |
| release-tma | **Дальше:** `code-review-and-quality` в «Прочитай» |
| spec-driven-development | **Дальше:** добавлен `game-economy-and-victory` |
| telegram-mini-app-runtime | **Дальше:** `browser-testing-with-devtools` |

## Next steps

- `/skill-test spec create-event` — behavioral pass для core-скилла
- `/skill-test category all` — rubric по категориям
