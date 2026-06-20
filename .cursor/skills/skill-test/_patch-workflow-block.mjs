#!/usr/bin/env node
/** @deprecated Prefer `node _maintain.mjs patch-workflow` — see README.md */
import fs from 'fs';import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const oldGeneral = `## Стандарт качества и вызов

**Release-ready:** [release-ready-quality.md](../_shared/release-ready-quality.md) — готовность к merge, не набросок; **допустимо больше токенов** на чтение spec/кода, анализ и self-review перед verdict.

**Границы:** [skill-responsibility-matrix.md](../_shared/skill-responsibility-matrix.md) — этот скилл **primary** только когда задача в его колонке «Когда primary»; иначе satellite или другой primary.
`;

const newGeneral = `## Стандарт качества и вызов

**Release-ready:** [release-ready-quality.md](../_shared/release-ready-quality.md) — готовность к merge, не набросок; **допустимо больше токенов** на чтение spec/кода, анализ и self-review перед verdict.

**Workflow:** [delivery-workflow.md](../_shared/delivery-workflow.md) — думаем → уточняем → планируем → делаем.

**Неясность:** [clarify-first.md](../_shared/clarify-first.md) — STOP и вопрос до implement; не угадывать.

**Границы:** [skill-responsibility-matrix.md](../_shared/skill-responsibility-matrix.md) — **primary** только в колонке «Когда primary»; иначе satellite или другой primary.
`;

const visualLine =
  '\n**Визуал:** [visual-assets-policy.md](../_shared/visual-assets-policy.md) — согласовать формат → сгенерировать → в репо; без временных заглушек.\n';

const oldMeta = `## Стандарт качества и вызов

**Meta-скилл:** не product delivery. Для кода/spec/UI — доменный скилл + [release-ready-quality.md](../_shared/release-ready-quality.md).
`;

const newMeta = `## Стандарт качества и вызов

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

  if (name === 'using-agent-skills' || name === 'project-cursor-skills-layout') {
    if (c.includes('delivery-workflow')) continue;
    if (!c.includes(oldMeta.trim())) continue;
    c = c.replace(oldMeta, newMeta);
  } else {
    if (c.includes('delivery-workflow.md')) continue;
    if (!c.includes(oldGeneral.trim().slice(0, 80))) continue;
    let block = newGeneral;
    if (visualSkills.has(name)) {
      block = block.trimEnd() + visualLine;
    }
    c = c.replace(oldGeneral, block);
  }

  fs.writeFileSync(p, c);
  patched++;
}

console.log(`Patched ${patched} skills`);
