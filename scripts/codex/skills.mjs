import fs from 'node:fs';
import path from 'node:path';

export const skillScopes = ['', 'game', 'plan', 'shared'];

export function skillsInScope(root, scope = '') {
  const dir = path.join(root, scope, '.agents/skills');
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).filter(entry => entry.isDirectory() && !entry.name.startsWith('.')).map(entry => ({
    name: entry.name, scope, file: path.posix.join(scope, '.agents/skills', entry.name, 'SKILL.md'),
  }));
}

// Mirrors documented ancestor discovery; this is not evidence of client activation.
export function visibleSkills(root, cwd = root) {
  const absoluteRoot = path.resolve(root);
  const absoluteCwd = path.resolve(cwd);
  const relative = path.relative(absoluteRoot, absoluteCwd);
  if (relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) throw new Error('cwd outside repository');
  const parts = relative ? relative.split(path.sep) : [];
  return ['', ...parts.map((_, index) => parts.slice(0, index + 1).join('/'))].flatMap(scope => skillsInScope(absoluteRoot, scope));
}

// Detect competing hook representations, not general TOML validity. Quoted and
// dotted keys are supported; feature toggles and multiline strings are ignored.
export function hasInlineHooks(text) {
  let section = ''; let multiline = null;
  for (const raw of text.split(/\r?\n/)) {
    let line = raw;
    if (multiline) {
      const end = line.indexOf(multiline);
      if (end < 0) continue;
      line = line.slice(end + 3); multiline = null;
    }
    const trim = line.trim();
    if (!trim || trim.startsWith('#')) continue;
    if (/^\[\[?\s*(?:hooks|"hooks"|'hooks')\s*(?:\.|\])/.test(trim)) return true;
    if (trim.startsWith('[')) section = trim;
    if (!section && /^(?:hooks|"hooks"|'hooks')\s*(?:\.|=)/.test(trim)) return true;
    const start = /"""|'''/.exec(line);
    if (start && line.indexOf(start[0], start.index + 3) < 0) multiline = start[0];
  }
  return false;
}
