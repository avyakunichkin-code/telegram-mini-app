#!/usr/bin/env node
/**
 * Session start: compact pointer for ТВОЙ ХОД agents.
 */
const msg = [
  'ТВОЙ ХОД: router `.cursor/rules/tvoy-hod-router.mdc` (primary + satellites).',
  'Контекст: `catalog.yaml` → `must_read` (всегда) + `read_if` (только если `when` совпадает с задачей; см. «Читай при условии» в SKILL.md).',
  'Workflow: `.cursor/skills/_shared/delivery-workflow.md` (думаем → уточняем → планируем → делаем).',
  'Экономика/победа → `game-economy-and-victory` + pytest; lab → `cd design-lab && npx serve .`.',
  'Карта: `CLAUDE.md`, `docs/agents/AI_ONBOARDING.md`.',
].join(' ');

process.stdout.write(JSON.stringify({ additional_context: msg }));
process.exit(0);
