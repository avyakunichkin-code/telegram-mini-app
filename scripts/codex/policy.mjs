import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export const BASELINE = 'backend/migrations/0000_schema_baseline.sql';
export function relativeTarget(target, cwd = ROOT, root = ROOT) {
  if (typeof target !== 'string' || !target || /[\0\r\n]/.test(target)) throw Error('Missing or invalid target');
  const api = /^[a-z]:[\\/]/i.test(root) ? path.win32 : path;
  if (/^[a-z]:[^\\/]/i.test(target) || target.startsWith('\\\\') || /:[^\\/]/.test(target.replace(/^[a-z]:/i, ''))) throw Error('Ambiguous path');
  const resolved = api.resolve(cwd, target.replace(/[\\/]/g, api.sep));
  const rel = api.relative(root, resolved).replaceAll('\\', '/');
  if (!rel || rel === '..' || rel.startsWith('../') || api.isAbsolute(rel)) throw Error('Target outside repository');
  // Resolve existing ancestors to reject junction/symlink escapes, including new children.
  if (root === ROOT) {
    let ancestor = resolved;
    while (!fs.existsSync(ancestor) && ancestor !== path.dirname(ancestor)) ancestor = path.dirname(ancestor);
    const real = fs.realpathSync(ancestor);
    const rr = path.relative(fs.realpathSync(root), real);
    if (rr === '..' || rr.startsWith(`..${path.sep}`) || path.isAbsolute(rr)) throw Error('Symlink escape');
  }
  return rel.toLowerCase();
}
export const isGenerated = p => p === 'design-lab/index.html' || /^design-lab\/(?:.*\/)?lab-base\.css$/.test(p);
export const isProtected = p => p === 'claude.md' || /(^|\/)(\.claude|\.cursor|\.git)(\/|$)/.test(p);

function sqlCode(text) {
  let result = ''; let i = 0;
  while (i < text.length) {
    const c = text[i]; const next = text[i + 1];
    if (c === '$') return null; // Procedural/dollar-quoted bodies are outside this subset.
    if (c === "'" || c === '"') {
      const quote = c; let closed = false; i++;
      while (i < text.length) {
        if (text[i] === '\\') return null; // Ambiguous escape modes require SQL-parser review.
        if (text[i] === quote) {
          if (text[i + 1] === quote) { i += 2; continue; }
          i++; closed = true; break;
        }
        i++;
      }
      if (!closed) return null;
      result += quote === "'" ? "''" : 'identifier'; continue;
    }
    if (c === '-' && next === '-') {
      while (i < text.length && text[i] !== '\n') i++;
      result += '\n'; continue;
    }
    if (c === '/' && next === '*') {
      let depth = 1; i += 2;
      while (i < text.length && depth) {
        if (text[i] === '/' && text[i + 1] === '*') { depth++; i += 2; }
        else if (text[i] === '*' && text[i + 1] === '/') { depth--; i += 2; }
        else i++;
      }
      if (depth) return null;
      result += ' '; continue;
    }
    result += c; i++;
  }
  return result;
}

// Conservative SQL subset: no procedural bodies, queries or data-changing statements.
// Not a PostgreSQL parser. Unrecognised syntax requires manual review, never a PASS.
export function ddlOnly(sql) {
  if (/^\s*--\s*>>>\s*\d{4}_/m.test(sql)) return false;
  const code = sqlCode(String(sql));
  if (code === null) return false;
  if (/\$|\b(insert|update|delete|merge|copy|truncate|do|call|execute|select)\b/i.test(code.replace(/ON\s+(DELETE|UPDATE)\s+(CASCADE|RESTRICT|SET\s+NULL|NO\s+ACTION)/gi, ''))) return false;
  return code.split(';').every(s => !s.trim() || /^\s*(CREATE\s+(?:UNIQUE\s+)?(?:TABLE|INDEX|SEQUENCE|SCHEMA|TYPE)|ALTER\s+(?:TABLE|SEQUENCE|TYPE)|DROP\s+(?:TABLE|INDEX|SEQUENCE|TYPE)|COMMENT\s+ON)\b/i.test(s));
}

export function patchOperations(patch) {
  if (typeof patch !== 'string') throw Error('Malformed patch');
  patch = patch.replaceAll('\r\n', '\n');
  if (!patch.startsWith('*** Begin Patch\n') || !patch.trimEnd().endsWith('*** End Patch')) throw Error('Malformed patch');
  const ops = []; let op;
  for (const line of patch.split(/\r?\n/)) {
    const match = /^\*\*\* (Add|Update|Delete) File: (.+)$/.exec(line);
    if (match) { op = { operation: match[1].toLowerCase(), target: match[2], added: '' }; ops.push(op); }
    else if (line.startsWith('*** Move to: ')) {
      if (!op || op.operation !== 'update') throw Error('Malformed move');
      op.operation = 'move-source';
      ops.push({ operation: 'move', target: line.slice(13), added: op.added });
    } else if (line.startsWith('+') && op) op.added += line.slice(1) + '\n';
  }
  if (!ops.length) throw Error('No patch targets');
  return ops;
}

export function fileOperations(input, name = '') {
  const operation = /delete/i.test(name) ? 'delete' : /move|rename/i.test(name) ? 'move-source' : 'update';
  const target = input.file_path ?? input.path ?? input.notebook_path;
  let ops;
  if (Array.isArray(input.edits) && input.edits.some(e => e.file_path ?? e.path)) ops = input.edits.map(e => ({ operation, target: e.file_path ?? e.path ?? target, added: e.new_string ?? e.content ?? '' }));
  else ops = [{ operation, target,
    added: [input.content, input.new_string, ...(input.edits ?? []).map(e => e.new_string)].filter(x => typeof x === 'string').join('\n') }];
  if (operation === 'move-source') {
    const dest = input.destination ?? input.new_path ?? input.destination_path;
    if (!dest) throw Error('Unmapped move destination');
    ops.push({ operation: 'move', target: dest, added: '' });
  }
  return ops;
}

export function decide(event, root = ROOT) {
  if (!event || typeof event !== 'object' || typeof event.tool_name !== 'string') throw Error('Malformed event');
  const input = event.tool_input;
  const name = event.tool_name;
  if (input === null || input === undefined) throw Error('Missing tool input');
  const cwd = input.workdir ?? event.cwd ?? root;
  if (/apply_patch$/i.test(name)) {
    const ops = patchOperations(typeof input === 'string' ? input : input.command ?? input.patch ?? input.input);
    return inspect(ops, cwd, root);
  }
  if (/^(Bash|exec_command|shell_command)$/.test(name) || /__exec_command$/.test(name)) {
    const cmd = input.command ?? input.cmd;
    if (typeof cmd !== 'string' || !cmd.trim()) throw Error('Missing shell command');
    // Anchored generator entrypoints; no compound commands or arbitrary extra flags.
    const gen = /^npm(?:\.cmd)? run (design-lab:build-nav|design-lab:build|design-lab:sync-round)(?: -- (design-lab\/[\w/-]+))?$/.exec(cmd.trim());
    if (gen) {
      if (relativeTarget(path.join(cwd, 'package.json'), root, root) !== 'frontend-react/package.json') return 'Generator requires frontend-react cwd';
      if (gen[1] === 'design-lab:sync-round') {
        if (!gen[2]) return 'Missing round';
        const rel = relativeTarget(gen[2], root, root);
        if (!rel.startsWith('design-lab/') || rel.includes('..')) return 'Invalid round';
      } else if (gen[2]) return 'Unexpected generator argument';
      return null;
    }
    const normal = cmd.replaceAll('\\', '/').toLowerCase();
    if (/(design-lab|lab-base\.css|0000_schema_baseline|\.claude|\.cursor|\.git\/|claude\.md)/.test(normal)) return 'Protected shell target: use a reviewed generator or file operation';
    if (/(-enc(?:odedcommand)?\b|frombase64string|invoke-expression|\biex\b)/i.test(cmd)) return 'Opaque shell command requires review';
    return null; // General shell is outside this path guard's security boundary.
  }
  // Unknown MCP can mutate remotely or hide paths; do not infer safety from missing file_path.
  if (/^mcp__/.test(name)) return /__(read|get|list|search|find|view)[_a-z]*$/i.test(name) ? null : 'Unmapped MCP operation: review its schema before extending policy';
  if (/write|edit|delete|move|rename|create_file|save_file/i.test(name)) return inspect(fileOperations(input, name), cwd, root);
  return null;
}
function inspect(ops, cwd, root) {
  for (const op of ops) {
    const rel = relativeTarget(op.target, cwd, root);
    if (isProtected(rel)) return 'Existing agent architecture is protected';
    if (isGenerated(rel)) return 'Generated lab output: edit source and run the exact generator';
    if (rel === BASELINE && (op.operation.startsWith('move') || op.operation === 'delete' || !ddlOnly(op.added))) return 'SQL baseline accepts reviewed DDL only';
  }
  return null;
}
