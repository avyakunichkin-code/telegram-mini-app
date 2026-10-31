import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.join(root, 'site');
const out = path.resolve(root, 'dist');
const base = process.env.BASE_PATH || '/';
if (!/^\/(?:[a-zA-Z0-9_-]+\/)*$/.test(base)) throw new Error('BASE_PATH must be an absolute directory path');
// Only the named, generated landing/dist directory may be removed.
if (out !== path.join(root, 'dist') || !out.startsWith(root + path.sep)) throw new Error('Invalid output path');
fs.rmSync(out, { recursive: true, force: true });
fs.cpSync(source, out, { recursive: true });
// Stable source names remain easy to edit; content versions prevent stale CSS/JS
// from surviving a Pages update in the browser or CDN cache.
for (const relative of fs.readdirSync(out, { recursive: true }).filter(file => file.endsWith('.html'))) {
  const file = path.join(out, relative);
  const versioned = fs.readFileSync(file, 'utf8').replace(/(href|src)="(\.\/[^"?]+\.(?:css|js))"/g, (match, attribute, url) => {
    const resource = path.resolve(path.dirname(file), url);
    if (!resource.startsWith(out + path.sep) || !fs.existsSync(resource)) throw new Error(`Missing local resource: ${url}`);
    const hash = createHash('sha256').update(fs.readFileSync(resource)).digest('hex').slice(0, 12);
    return `${attribute}="${url}?v=${hash}"`;
  });
  fs.writeFileSync(file, versioned);
}
const htmlPath = path.join(out, 'index.html');
const html = fs.readFileSync(htmlPath, 'utf8').replace('<head>', `<head><base href="${base}">`);
fs.writeFileSync(htmlPath, html);
fs.writeFileSync(path.join(out, '.nojekyll'), '');
console.log(`Built approved landing A at ${out}; base ${base}`);
