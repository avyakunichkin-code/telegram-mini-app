#!/usr/bin/env node
/** @deprecated Prefer `node _maintain.mjs inject-quality` — see README.md */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const block = `
## Стандарт качества и вызов

**Release-ready:** [release-ready-quality.md](../_shared/release-ready-quality.md) — готовность к merge, не набросок; **допустимо больше токенов** на чтение spec/кода, анализ и self-review перед verdict.

**Workflow:** [delivery-workflow.md](../_shared/delivery-workflow.md) — думаем → уточняем → планируем → делаем.

**Неясность:** [clarify-first.md](../_shared/clarify-first.md) — STOP и вопрос до implement; не угадывать.

**Границы:** [skill-responsibility-matrix.md](../_shared/skill-responsibility-matrix.md) — **primary** только в колонке «Когда primary»; иначе satellite или другой primary.

`;

const visualLine =
  '**Визуал:** [visual-assets-policy.md](../_shared/visual-assets-policy.md) — согласовать формат → сгенерировать → в репо; без временных заглушек.\n';

const metaBlock = `
## Стандарт качества и вызов

**Meta-скилл:** не product delivery. Для кода/spec/UI — доменный скилл + [release-ready-quality.md](../_shared/release-ready-quality.md).

**Workflow:** [delivery-workflow.md](../_shared/delivery-workflow.md) · **Уточнение:** [clarify-first.md](../_shared/clarify-first.md).

`;

const visualSkills = new Set([
  'frontend-ui-engineering',
  'design-lab-mqx',
  'social-changelog-posts',
]);

const skip = new Set(['_shared', '_archived', 'specs', 'results', 'templates', 'skill-test']);
let patched = 0;

for (const name of fs.readdirSync(root)) {
  if (skip.has(name)) continue;
  const p = path.join(root, name, 'SKILL.md');
  if (!fs.existsSync(p)) continue;
  let c = fs.readFileSync(p, 'utf8');
  if (c.includes('delivery-workflow')) continue;
  const fmEnd = c.indexOf('---', 4);
  if (fmEnd < 0) continue;
  const insertAt = c.indexOf('\n', fmEnd + 3) + 1;
  let useBlock =
    name === 'using-agent-skills' || name === 'project-cursor-skills-layout'
      ? metaBlock
      : block;
  if (visualSkills.has(name)) {
    useBlock = useBlock.trimEnd() + '\n' + visualLine + '\n';
  }
  c = c.slice(0, insertAt) + useBlock + c.slice(insertAt);
  fs.writeFileSync(p, c);
  patched++;
}

console.log(`Patched ${patched} skills`);
