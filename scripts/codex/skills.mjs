import fs from 'node:fs';
import path from 'node:path';

export const skillScopes = ['', 'game', 'plan', 'shared'];

export function skillsInScope(root, scope = '') {
  const dir = path.join(root, scope, '.agents/skills');
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).filter(entry => {
    if (entry.name.startsWith('.')) return false;
    if (entry.isSymbolicLink()) {
      const target = fs.realpathSync(path.join(dir, entry.name));
      const allowed = skillScopes.some(candidate => {
        const relative = path.relative(path.resolve(root, candidate, '.agents/skills'), target);
        return relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
      });
      if (!allowed) throw new Error(`Skill link requires review outside current skill roots: ${scope}/${entry.name}`);
      return fs.statSync(target).isDirectory();
    }
    return entry.isDirectory();
  }).map(entry => ({
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
  function stripComment(line) {
    let quote = null;
    for (let i = 0; i < line.length; i++) {
      if (quote) {
        if (quote === '"' && line[i] === '\\') { i++; continue; }
        if (line[i] === quote) quote = null;
      } else if (line[i] === '#') return line.slice(0, i);
      else if (line.startsWith('"""', i) || line.startsWith("'''", i)) {
        const delimiter = line.slice(i, i + 3);
        const end = line.indexOf(delimiter, i + 3);
        if (end < 0) return line;
        i = end + 2;
      } else if (line[i] === '"' || line[i] === "'") quote = line[i];
    }
    return line;
  }
  let section = ''; let multiline = null;
  for (const raw of text.split(/\r?\n/)) {
    let line = raw;
    if (multiline) {
      const end = line.indexOf(multiline);
      if (end < 0) continue;
      line = line.slice(end + 3); multiline = null;
    }
    line = stripComment(line);
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
