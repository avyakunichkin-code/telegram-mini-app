import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MARKER = 'АРХИВ (ТВОЙ ХОД)';

const banner = `> **${MARKER}** — studio/GDD-наследие, \`disable-model-invocation\`. **Не используй** пути \`design/gdd/\`, \`design/ux/\`, \`.claude/design/\` — в этом репозитории их нет.
>
> | Вместо studio | В ТВОЙ ХОД |
> |---------------|------------|
> | \`design/gdd/*\`, game concept | [\`docs/foundation/SPEC_PRODUCT.md\`](../../../../docs/foundation/SPEC_PRODUCT.md), [\`docs/vision/ideas/\`](../../../../docs/vision/ideas/) → скилл **idea-refine** |
> | GDD / системный дизайн | [\`docs/specs/features/\`](../../../../docs/specs/features/) → **spec-driven-development** |
> | \`design/ux/*\`, HUD, patterns | [\`docs/specs/SPEC_FRONTEND_UI.md\`](../../../../docs/specs/SPEC_FRONTEND_UI.md) → **frontend-ui-engineering** |
> | Визуальные макеты | **design-lab-mqx** → [\`DESIGN_WORKFLOW.md\`](../../../../frontend-react/src/components/mqx/DESIGN_WORKFLOW.md) |
> | ADR / архитектура | [\`docs/decisions/\`](../../../../docs/decisions/), [\`CLAUDE.md\`](../../../../CLAUDE.md) |
> | Код-ревью | **code-review-and-quality** (корень \`.cursor/skills/\`) |
> | Онбординг | [\`CLAUDE.md\`](../../../../CLAUDE.md), [\`docs/agents/CURSOR_SKILLS.md\`](../../../../docs/agents/CURSOR_SKILLS.md) |
>
> Карта фаз: [\`docs/agents/SKILL_DOC_MAP.md\`](../../../../docs/agents/SKILL_DOC_MAP.md). Процедуры ниже — **studio-ориентир**; выходы пиши в \`docs/\`, не создавай \`design/\` без явного запроса.
`;

const dirs = fs.readdirSync(__dirname, { withFileTypes: true });
let updated = 0;

for (const ent of dirs) {
  if (!ent.isDirectory() || ent.name.startsWith('_')) continue;
  const skillPath = path.join(__dirname, ent.name, 'SKILL.md');
  if (!fs.existsSync(skillPath)) continue;

  let text = fs.readFileSync(skillPath, 'utf8');
  if (text.includes(MARKER)) {
    console.log(`skip ${ent.name}: already has banner`);
    continue;
  }

  const m = text.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n/);
  if (!m) {
    console.error(`fail ${ent.name}: no frontmatter`);
    process.exitCode = 1;
    continue;
  }

  text = text.slice(0, m[0].length) + banner + '\n' + text.slice(m[0].length);
  fs.writeFileSync(skillPath, text, 'utf8');
  updated++;
  console.log(`ok ${ent.name}`);
}

console.log(`\nUpdated ${updated} skills`);
