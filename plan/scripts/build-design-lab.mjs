import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../design-lab');
const escape = value => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');
const rounds = [];
function walk(dir) {
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    if (item.isDirectory() && !['assets', 'node_modules', 'dist', '_baseline'].includes(item.name)) walk(path.join(dir, item.name));
    else if (item.name === 'index.html' && dir !== root) rounds.push(path.relative(root, path.join(dir, item.name)).replaceAll('\\', '/'));
  }
}
walk(root);
const links = rounds.sort().map(href => `<li><a href="./${escape(href)}">${escape(href.replace(/\/index\.html$/, ''))}</a></li>`).join('\n');
fs.writeFileSync(path.join(root, 'index.html'), `<!doctype html><html lang="ru"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>ТВОЙ ПЛАН · Design Lab</title><h1>ТВОЙ ПЛАН · Design Lab</h1><ul>${links}</ul></html>\n`);
console.log(`PLAN lab: ${rounds.length} rounds`);
