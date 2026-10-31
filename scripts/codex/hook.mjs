import fs from 'node:fs';
import path from 'node:path';
import { ROOT, decide, patchOperations, fileOperations } from './policy.mjs';

const mode = process.argv[2];
try {
  const raw = fs.readFileSync(0, 'utf8');
  if (Buffer.byteLength(raw) > 4 * 1024 * 1024) throw Error('Payload too large');
  const event = JSON.parse(raw);
  if (mode === 'pre') {
    const reason = decide(event);
    if (reason) { console.error(`Codex repository guard: ${reason}`); process.exit(2); }
  } else if (mode === 'session') {
    console.log(JSON.stringify({ hookSpecificOutput: { hookEventName: 'SessionStart', additionalContext: 'Read AGENTS.md; choose one primary skill in .agents/skills. Hook activation evidence: docs/ai/CODEX-HOOKS.md.' } }));
  } else if (mode === 'post') {
    const input = event.tool_input ?? {};
    let targets = [];
    if (/apply_patch$/.test(event.tool_name ?? '')) targets = patchOperations(typeof input === 'string' ? input : input.command ?? input.patch ?? input.input).map(x => x.target);
    else if (/write|edit|delete|move|rename/i.test(event.tool_name ?? '')) targets = fileOperations(input,event.tool_name).map(x=>x.target).filter(Boolean);
    const joined = targets.join('/').replaceAll('\\', '/');
    const hints = [];
    if (/backend\/|packages\/fincore|data\/events/.test(joined)) hints.push('Use verify-change: backend pytest includes fincore; significant economy/data changes need 30–40-period baseline comparison.');
    if (/frontend-react\/|design-lab\//.test(joined)) hints.push('Use DESIGN_WORKFLOW: new pattern needs lab + human approval, states and canon; run frontend checks by scope.');
    if (hints.length) {
      const state = path.join(ROOT, '.codex-state'); fs.mkdirSync(state, { recursive: true });
      const p = path.join(state, 'hint-throttle.json');
      let last = {}; try { last = JSON.parse(fs.readFileSync(p, 'utf8')); } catch {}
      const key = hints.join(' ');
      if (Date.now() - (last[key] ?? 0) >= 120000) {
        last[key] = Date.now(); fs.writeFileSync(p, JSON.stringify(last));
        console.log(JSON.stringify({ hookSpecificOutput: { hookEventName: 'PostToolUse', additionalContext: key } }));
      }
    }
  } else throw Error('Unknown hook mode');
} catch {
  // Never echo payload, command or file contents, including malformed input.
  console.error('Codex repository hook: invalid payload or adapter failure; no sensitive payload echoed.');
  process.exit(mode === 'pre' ? 2 : 1);
}
