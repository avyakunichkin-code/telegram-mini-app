import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];
const exists = rel => fs.existsSync(path.join(root, rel));
const documents = ['README.md', 'AGENTS.md', 'ARCHITECTURE.md', 'docs/README.md',
  'docs/DOCUMENTATION_SYSTEM.md', 'docs/decisions/ADR-018-product-roots.md',
  'docs/plans/PLAN_product-roots.md', 'shared/README.md', 'shared/AGENTS.md',
  'shared/contracts/README.md'];
for (const product of ['game', 'plan']) {
  for (const entry of ['web/package.json', 'api/requirements.txt', 'landing/package.json', 'docs', 'design-lab']) {
    if (!exists(`${product}/${entry}`)) errors.push(`Missing ${product}/${entry}`);
  }
  for (const entry of ['README.md', 'AGENTS.md', 'ARCHITECTURE.md', 'docs/README.md']) documents.push(`${product}/${entry}`);
  const api = path.join(root, product, 'api');
  for (const line of fs.readFileSync(path.join(api, 'requirements.txt'), 'utf8').split(/\r?\n/)) {
    if (line.startsWith('-e ') && !fs.existsSync(path.resolve(api, line.slice(3).trim()))) errors.push(`Invalid editable dependency: ${product}: ${line}`);
  }
}
for (const name of ['fincore', 'platform', 'api-client', 'ui-kit']) {
  if (!exists(`shared/packages/${name}/src`)) errors.push(`Missing shared package ${name}`);
}
for (const doc of documents) {
  if (!exists(doc)) { errors.push(`Missing ${doc}`); continue; }
  const content = fs.readFileSync(path.join(root, doc), 'utf8');
  for (const match of content.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
    const target = match[1].replace(/^<|>$/g, '').split('#')[0];
    if (!target || /^(?:https?:|mailto:)/.test(target)) continue;
    if (!fs.existsSync(path.resolve(root, path.dirname(doc), target))) errors.push(`Broken link ${doc}: ${target}`);
  }
}
for (const name of ['ci.yml', 'deploy-app.yml']) {
  const text = fs.readFileSync(path.join(root, '.github/workflows', name), 'utf8');
  for (const match of text.matchAll(/^\s+working-directory:\s*([^\s]+)\s*$/gm)) {
    const dir = match[1].replace(/^['"]|['"]$/g, '');
    if (!exists(dir) || /^(?:backend|frontend-react|apps)(?:\/|$)/.test(dir)) errors.push(`Invalid workflow cwd ${name}: ${dir}`);
  }
}
if (errors.length) { errors.forEach(e => console.error(`FAIL: ${e}`)); process.exitCode = 1; }
else console.log(`PASS: product roots, shared packages, editable dependencies, workflow cwd and ${documents.length} navigation documents`);
