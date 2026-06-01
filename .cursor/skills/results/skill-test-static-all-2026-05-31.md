# Skill Static Check: All Skills

**Date:** 2026-05-31  
**Mode:** static all  
**Script:** `.cursor/skills/skill-test/_static-check.mjs` (+ archived pass)

## Active skills (29)

| Skill | Result | Issues |
|-------|--------|--------|
| api-and-interface-design | COMPLIANT | |
| balance-playtest | COMPLIANT | |
| browser-testing-with-devtools | COMPLIANT | |
| code-review-and-quality | COMPLIANT | |
| code-simplification | COMPLIANT | |
| context-engineering | COMPLIANT | |
| create-event | COMPLIANT | |
| critical-test-scenarios | COMPLIANT | |
| deprecation-and-migration | COMPLIANT | |
| design-lab-mqx | COMPLIANT | |
| documentation-and-adrs | COMPLIANT | |
| doubt-driven-development | COMPLIANT | |
| event-analysis | COMPLIANT | |
| frontend-ui-engineering | COMPLIANT | |
| game-economy-and-victory | COMPLIANT | |
| idea-refine | COMPLIANT | |
| incremental-implementation | COMPLIANT | |
| performance-optimization | COMPLIANT | |
| planning-and-task-breakdown | COMPLIANT | |
| project-cursor-skills-layout | COMPLIANT | |
| project-handbook-documentation | COMPLIANT | |
| release-tma | COMPLIANT | |
| security-and-hardening | COMPLIANT | |
| skill-test | COMPLIANT | |
| social-changelog-posts | COMPLIANT | |
| spec-driven-development | COMPLIANT | |
| telegram-mini-app-runtime | COMPLIANT | |
| test-driven-development | COMPLIANT | |
| using-agent-skills | COMPLIANT | |

## Archived skills (11)

All **COMPLIANT**: architecture-review, brainstorm, code-review, create-architecture, design-review, design-system, onboard, retrospective, team-ui, ux-design, ux-review.

## Aggregate (2026-05-31, после фикса balance-playtest + release-tma)

**Summary:** 40 COMPLIANT, 0 WARNINGS, 0 NON-COMPLIANT  
**Aggregate Verdict:** COMPLIANT

## Remediation (closed)

- `balance-playtest` — добавлены verdict keywords PASS/CONCERNS/FAIL/COMPLIANT/NON-COMPLIANT в §4
- `release-tma` — добавлены «May I write» / «Могу записать» + «по умолчанию только чтение»

## Next steps

- Fix `balance-playtest`, re-run `/skill-test static balance-playtest`
- Optional: `/skill-test spec balance-playtest` after structural fix
- `/skill-test context all` for catalog ↔ SKILL ↔ docs alignment
