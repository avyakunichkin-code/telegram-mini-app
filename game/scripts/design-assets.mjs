import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const designRoot = path.join(repo, 'game/design');
const project = path.join(designRoot, 'system');
const check = process.argv.includes('--check');
let failures = 0;
function within(root, relative) {
  const result = path.resolve(root, relative);
  if (!result.startsWith(root + path.sep)) throw new Error(`Path outside root: ${relative}`);
  return result;
}
function emit(target, data) {
  const bytes = Buffer.isBuffer(data) ? data : Buffer.from(data);
  if (fs.existsSync(target) && fs.readFileSync(target).equals(bytes)) return;
  if (check) { console.error(`STALE ${path.relative(repo, target)}`); failures++; return; }
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, bytes);
}
const manifest = JSON.parse(fs.readFileSync(path.join(designRoot, 'asset-exports.json'), 'utf8'));
const targets = new Set();
for (const entry of manifest.exports) {
  if (targets.has(entry.target)) throw new Error(`Duplicate export: ${entry.target}`);
  targets.add(entry.target);
  emit(within(repo, entry.target), fs.readFileSync(within(designRoot, entry.source)));
}
for (const file of fs.readdirSync(path.join(repo, 'game/web/src/assets'), { recursive: true })) {
  if (!/\.(png|webp|svg|woff2|json|tgs|lottie|gif)$/.test(file)) continue;
  const relative = `game/web/src/assets/${file.split(path.sep).join('/')}`;
  if (!targets.has(relative)) { console.error(`UNREGISTERED ${relative}: add the source to the design system first`); failures++; }
}

// The standalone landing is packaged without external filesystem dependencies.
// Its local assets are exports of the same design system, never separate masters.
const dist = path.join(repo, 'game/design-lab/landing-refresh-20261030/dist');
const art = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(project, 'illustrations/characters.js'), 'utf8'), art);
vm.runInNewContext(fs.readFileSync(path.join(project, 'illustrations/monetka.js'), 'utf8'), art);
const personas = [['student','Студент','studbilet','Студбилет'],['pro','Профессионал','card','Зарплатная карта'],['boss','Руководитель','briefcase','Портфель'],['biz','Предприниматель','phone','Смартфон']];
const svgDocument = svg => svg.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ');
for (const [key,label,buddy,buddyLabel] of personas) {
  const human = svgDocument(art.window.TH_CHARACTERS.persona(key,label));
  const companion = svgDocument(art.window.TH_CHARACTERS.companion(buddy,'calm',buddyLabel));
  emit(within(project, `assets/Characters/${key}-chibi.svg`), human);
  emit(within(project, `assets/Companions/${buddy}.svg`), companion);
  emit(within(dist, `assets/${key}-chibi.svg`), human);
  emit(within(dist, `assets/${buddy}.svg`), companion);
}
emit(within(project, 'assets/Monetka/monetka-ink-full.svg'), svgDocument(art.window.TH_MONETKA({id:'monetka-design',top:'ТВОЙ ХОД',face:'smile',arms:'wave',label:'Монетка'})));
const landingAssets = [
  ['archive/legacy-logo-sources/logo-full-sizes/logo-full-h140.webp', 'assets/logo-full-h140.webp'],
  ['archive/legacy-logo-sources/logo-full-sizes/logo-full-h210.webp', 'assets/logo-full-h210.webp'],
  ['archive/legacy-logo-sources/logo-full-sizes/logo-full-h280.webp', 'assets/logo-full-h280.webp'],
  ['system/assets/Monetka/monetka-ink-avatar.svg', 'assets/monetka-ink-avatar.svg'],
];
for (const [source, target] of landingAssets) emit(within(dist, target), fs.readFileSync(within(designRoot, source)));
const tokens = JSON.parse(fs.readFileSync(path.join(project, 'tokens.json'), 'utf8'));
const light = [], dark = [];
for (const section of Object.values(tokens)) {
  for (const token of section?.tokens ?? []) {
    if (typeof token.value === 'string') { light.push(`--${token.name}:${token.value};`); }
    else if (token.value?.light) {
      light.push(`--${token.name}:${token.value.light};`);
      dark.push(`--${token.name}:${token.value.dark};`);
    }
  }
}
// Discover the documented font records without guessing filenames or duplicating values.
function collectFaces(value, result = []) {
  if (Array.isArray(value)) value.forEach(item => collectFaces(item, result));
  else if (value && typeof value === 'object') {
    if (value.family && value.file && value.weight) result.push(value);
    else Object.values(value).forEach(item => collectFaces(item, result));
  }
  return result;
}
const fontCSS = collectFaces(tokens).map(face => {
  emit(within(dist, `ds/${face.file}`), fs.readFileSync(within(project, face.file)));
  return `@font-face{font-family:"${face.family}";src:url('./${face.file}') format('woff2');font-weight:${face.weight};font-style:${face.style};font-display:swap}`;
}).join('\n');
light.push('--font-display:Nunito,system-ui,sans-serif;', '--font-body:Manrope,system-ui,sans-serif;');
emit(within(dist, 'ds/tokens.css'), `/* Generated from design-system tokens.json. */\n${fontCSS}\n:root{${light.join('')}}\n[data-theme="dark"],body[data-variant="b"]{${dark.join('')}}\n`);
emit(path.join(project, 'tokens.css'), `/* Generated by scripts/design-assets.mjs. */\n${fontCSS}\n:root{${light.join('')}}\n[data-theme="dark"]{${dark.join('')}}\n`);
emit(within(dist, 'ds/bundle.css'), fs.readFileSync(path.join(project, 'components/bundle.css')));
const inkArchive = path.join(designRoot, 'archive/ink-edge-2026-11');
const previewInk = fs.readFileSync(path.join(inkArchive, 'InkEdge/examples.css'));
emit(within(dist, 'ds/ink-examples.css'), previewInk);
const index = JSON.parse(fs.readFileSync(path.join(designRoot, 'archive/classic-v3/design-system.json'), 'utf8'));
const blobs = new Map();
for (const [group, assets] of Object.entries(index.assetGroups)) {
  for (const [name, asset] of Object.entries(assets.files)) {
    if (asset.blob) blobs.set(asset.blob, `assets/${group}/${name}`);
  }
}
for (const name of ['TurnCard', 'MoneyTiles', 'EventCard', 'InkEdge']) {
  const preview = name === 'InkEdge'
    ? path.join(inkArchive, 'InkEdge/preview.html')
    : path.join(project, `components/${name}/preview.html`);
  let html = fs.readFileSync(preview, 'utf8');
  html = html.replace(/\/_blob\/([a-z0-9]+)/g, (_, blob) => {
    const source = blobs.get(blob);
    if (!source) throw new Error(`Unknown design-system blob: ${blob}`);
    const currentSource = source.startsWith('assets/Personas/') ? 'assets/Characters/student-chibi.svg' : source.startsWith('assets/Monetka/') ? 'assets/Monetka/monetka-ink-avatar.svg' : source;
    const target = `ds/${currentSource}`;
    emit(within(dist, target), fs.readFileSync(within(project, currentSource)));
    return `./${currentSource}`;
  });
  // A static showcase must not offer dead buttons or pretend to be a live dialog.
  html = html.replace(/<button\b([^>]*)>/g, '<div $1>').replace(/<\/button>/g, '</div>')
    .replace(/role="dialog"/g, 'role="group"').replace(/ aria-pressed="[^"]*"/g, '');
  emit(within(dist, `ds/${name}.html`), `<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${name} — Чернильный край</title><link rel="stylesheet" href="./tokens.css"><link rel="stylesheet" href="./bundle.css"><link rel="stylesheet" href="./ink-examples.css"><style>body{background:transparent}.th-stage{max-width:none;padding:16px}html{overflow-x:hidden}</style></head><body class="th-ink">${html}</body></html>\n`);
}
emit(path.join(inkArchive, 'ink-preview.html'), fs.readFileSync(within(dist, 'ds/InkEdge.html'), 'utf8')
  .replace('./tokens.css', '../../system/tokens.css')
  .replace('./bundle.css', '../../system/components/bundle.css')
  .replace('./ink-examples.css', './InkEdge/examples.css')
  .replaceAll('./assets/', '../../system/assets/'));
function walk(root) {
  return fs.readdirSync(root, { recursive: true }).filter(file => fs.statSync(path.join(root, file)).isFile()).map(file => file.split(path.sep).join('/')).sort();
}
const canon = JSON.parse(fs.readFileSync(path.join(project, 'design-canon.json'), 'utf8'));
const assetFiles = walk(path.join(project, 'assets')).filter(file =>
  /\.(png|webp|svg|ico)$/.test(file) &&
  /^(Logos\/finance-game\/|Characters\/landing-v3\/|Monetka\/monetka-soft-volume|Icons\/|Actions\/|Capital\/|Menu\/|Needs\/)/.test(file)
);
emit(path.join(project, 'design-system.json'), JSON.stringify({
  schema_version: 1,
  title: 'ТВОЙ ХОД',
  current_style: canon.direction,
  runtime: 'runtime/',
  tokens: 'tokens.json',
  assets: assetFiles.map(file => 'assets/' + file),
  exports: '../asset-exports.json',
  archive: '../archive/classic-v3/',
}, null, 2) + '\n');
emit(path.join(designRoot, 'index.html'), '<!doctype html><html lang="ru"><meta charset="utf-8"><title>Дизайн ТВОЙ ХОД</title><meta http-equiv="refresh" content="0;url=./system/index.html"><a href="./system/index.html">Актуальная система</a> · <a href="./archive/classic-v3/README.md">Архив</a></html>\n');
const assetCards = assetFiles.map(file => `<figure><a href="./assets/${file}"><img loading="lazy" src="./assets/${file}" alt="${file}"></a><figcaption>${file}</figcaption></figure>`).join('');
const screenLinks = canon.surfaces
  .filter(screen => screen.preview)
  .map(screen => `<li><a href="../../${screen.preview}">${screen.name}</a></li>`).join('');
emit(path.join(project, 'index.html'), `<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Твой ход · ${canon.direction}</title><link rel="stylesheet" href="./tokens.css"><style>body{margin:0;padding:32px;font:15px/1.6 Manrope,system-ui;background:var(--mq-board);color:var(--mq-board-ink)}main{max-width:1200px;margin:auto}h1,h2{font-family:Nunito,system-ui}.assets{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:16px}figure{margin:0;background:var(--mq-cell);padding:16px;border-radius:12px}img{width:100%;height:140px;object-fit:contain}figcaption{font-size:12px;overflow-wrap:anywhere}</style></head><body><main><h1>Твой ход · ${canon.direction}</h1><p><a href="./CURRENT_STYLE.md">Утверждения и реализация</a> · <a href="../../docs/reference/brandbook/BRANDBOOK.md">Брендбук</a> · <a href="./assets/Logos/README.md">Форматы логотипа</a></p><h2>Экраны Design Lab</h2><ul>${screenLinks}</ul><h2>Ассеты действующего направления</h2><div class="assets">${assetCards}</div></main></body></html>\n`);
console.log(`${check ? 'Checked' : 'Synced'} ${targets.size} asset exports + landing design-system examples; ${failures} stale files`);
process.exitCode = failures ? 1 : 0;
