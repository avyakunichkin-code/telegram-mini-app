#!/usr/bin/env node
/**
 * SessionStart (Claude Code): compact pointer for ТВОЙ ХОД agents.
 * Формат ответа: hookSpecificOutput.additionalContext (https://code.claude.com/docs/en/hooks).
 */
const msg = [
  'ТВОЙ ХОД: роутер `.claude/rules/router.md` (primary skill + satellites); свод принципов — `CONVENTIONS.md`.',
  'Скиллы: `.claude/skills/<name>/SKILL.md`, метаданные и tier — `.claude/skills/catalog.yaml` (`must_read` всегда, `read_if` — только при совпадении `when`).',
  'Workflow: `.claude/skills/_shared/delivery-workflow.md` (думаем → уточняем → планируем → делаем).',
  'Экономика/победа → skill `game-economy-and-victory` + `cd backend && python -m pytest -q`; lab → `cd design-lab && npx serve .`.',
].join(' ');

process.stdout.write(
  JSON.stringify({
    hookSpecificOutput: { hookEventName: 'SessionStart', additionalContext: msg },
  }),
);
process.exit(0);
