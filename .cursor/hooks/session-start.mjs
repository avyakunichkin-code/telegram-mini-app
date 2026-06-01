#!/usr/bin/env node
/**
 * Session start: compact pointer for ТВОЙ ХОД agents.
 */
const msg = [
  'ТВОЙ ХОД: роутер `.cursor/rules/tvoy-hod-router.mdc` (фаза → primary skill + satellites).',
  'Экономика/победа → `game-economy-and-victory` + pytest.',
  'Design-lab макеты → хаб `cd design-lab && npx serve .` (не serve в подпапке round); см. `docs/agents/DESIGN_LAB_NAVIGATION.md`.',
  'Карта кода → `CLAUDE.md`; скиллы → `docs/agents/CURSOR_SKILLS.md`.',
].join(' ');

process.stdout.write(JSON.stringify({ additional_context: msg }));
process.exit(0);
