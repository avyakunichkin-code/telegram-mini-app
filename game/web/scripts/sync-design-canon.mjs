import postcss from 'postcss';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const manifest = JSON.parse(readFileSync(resolve(root, 'design/system/design-canon.json'), 'utf8').replace(/^\uFEFF/, ''));
const documentPath = resolve(root, 'design/system/CURRENT_STYLE.md');
const document = readFileSync(documentPath, 'utf8');
const mode = process.argv[2];
const start = '<!-- design-canon:start -->';
const end = '<!-- design-canon:end -->';
const region = /<!-- design-canon:start -->[\s\S]*?<!-- design-canon:end -->/g;

function link(path, label) {
  if (!path) return '—';
  const target = resolve(root, path);
  if (relative(root, target).startsWith('..') || !existsSync(target)) {
    throw new Error('Недоступная ссылка в цепочке дизайна: ' + path);
  }
  return '[' + label + '](' + relative(dirname(documentPath), target).replaceAll('\\', '/') + ')';
}

const statuses = { preview: 'На рассмотрении', approved: 'Утверждено', implemented: 'Подключено к игре' };
if (!manifest.direction?.trim() || !manifest.surfaces.length) throw new Error('Укажи направление и экраны.');
const names = new Set();
const rows = manifest.surfaces.map(({ name, scope, revision, status, preview, approval, source, verification }) => {
  if (!name || names.has(name) || !Object.hasOwn(statuses, status)) throw new Error('Некорректная запись: ' + name);
  if (!Object.hasOwn(manifest.scopes, scope)) throw new Error('Неизвестная область: ' + scope);
  if (status === 'implemented' && (!Number.isInteger(revision) || revision < 1 || revision > manifest.revision)) {
    throw new Error('Некорректная ревизия реализации: ' + name);
  }
  names.add(name);
  if (status === 'preview' && (!preview || approval || source) ||
      status === 'approved' && (!approval || source) ||
      status === 'implemented' && (!approval || !source)) {
    throw new Error('Ссылки не соответствуют статусу: ' + name);
  }
  return ['|', name, '|', manifest.scopes[scope], '|', statuses[status], '|', revision ?? '—', '|', link(preview, 'Lab'), '|',
    link(approval, 'Решение'), '|', link(source, 'Код'), '|', link(verification, 'Проверка'), '|'].join(' ');
});
if (!Number.isInteger(manifest.revision) || manifest.revision < 1) throw new Error('Укажи ревизию канона.');
const useLabels = { shared: 'Общий', variant: 'Согласованный вариант', pending: 'Перенос предстоит' };
const sharedRows = manifest.shared.flatMap(({ name, source, uses }) => {
  const seen = new Set();
  return uses.map(({ scope, path, state, preview }) => {
    if (!Object.hasOwn(manifest.scopes, scope) || seen.has(scope) || !Object.hasOwn(useLabels, state)) {
      throw new Error('Некорректный потребитель: ' + name + ' / ' + scope);
    }
    seen.add(scope);
    return ['|', name, '|', link(source, 'Источник'), '|', manifest.scopes[scope], '|',
      useLabels[state], '|', link(path, 'Потребитель'), '|', link(preview, 'Lab'), '|'].join(' ');
  });
});

const wideStyles = 'web/src/styles/mqx/wide-web.css';
postcss.parse(readFileSync(resolve(root, wideStyles), 'utf8'), { from: wideStyles }).walkRules(rule => {
  for (const selector of rule.selectors) {
    if (selector !== '#root:has(.mqx-wide)' && !/^\.mqx-wide(?:\b|__)/.test(selector)) {
      throw rule.error('Стиль широкого превью должен принадлежать оболочке .mqx-wide: ' + selector);
    }
  }
});
const generated = [
  start,
  'Актуальное направление — **«' + manifest.direction + '»**, ревизия ' + manifest.revision + '.',
  '',
  '| Экран | Область | Статус | Ревизия | Превью | Утверждение | Реализация | Проверка канона |',
  '|---|---|---|---|---|---|---|---|',
  ...rows,
  '',
  '| Общий элемент | Источник | Область | Подключение | Потребитель | Превью |',
  '|---|---|---|---|---|---|',
  ...sharedRows,
  end,
].join('\n');

if ([...document.matchAll(region)].length !== 1) throw new Error('Ожидается один блок design-canon в CURRENT_STYLE.md.');
const updated = document.replace(region, () => generated.replaceAll('\n', document.includes('\r\n') ? '\r\n' : '\n'));
if (mode === '--write') {
  if (updated !== document) writeFileSync(documentPath, updated);
} else if (updated !== document) {
  throw new Error('CURRENT_STYLE.md устарел. Из web выполни npm run design:sync.');
}
console.log('OK: цепочка дизайна (' + rows.length + ' экранов)');
