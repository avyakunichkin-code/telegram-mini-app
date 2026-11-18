import fs from 'node:fs';
import path from 'node:path';
import { ROOT, BASELINE, ddlOnly } from './policy.mjs';
import { legacyDependencies, markdownFiles } from './dependencies.mjs';
import { skillScopes, skillsInScope, visibleSkills, hasInlineHooks } from './skills.mjs';

const failures = [];
const check = (ok, message) => { if (!ok) failures.push(message); };
const read = p => fs.readFileSync(path.join(ROOT,p),'utf8');
const exists = p => fs.existsSync(path.join(ROOT,p));
const skills = skillScopes.flatMap(scope => skillsInScope(ROOT, scope));
check(skills.length > 0, 'No project skills found');
for (const scope of skillScopes) {
  const visible = visibleSkills(ROOT, path.join(ROOT, scope));
  check(new Set(visible.map(row => row.name)).size === visible.length, `Duplicate skill names in ${scope || 'repository root'} discovery chain`);
  const config = path.posix.join(scope, '.codex/config.toml');
  const hooksFile = path.posix.join(scope, '.codex/hooks.json');
  if (exists(config) && exists(hooksFile)) check(!hasInlineHooks(read(config)), `Duplicate hook representations in ${scope || 'repository root'}: use hooks.json or inline hooks`);
}
const markdown = ['AGENTS.md', 'game/AGENTS.md', 'plan/AGENTS.md', 'shared/AGENTS.md', ...skills.map(row=>row.file),...fs.readdirSync(path.join(ROOT,'docs/engineering')).filter(n=>n.endsWith('.md')).map(n=>`docs/engineering/${n}`)];
markdown.push(...markdownFiles(ROOT, ['game/docs/engineering', 'plan/docs/engineering']));
markdown.push(...markdownFiles(ROOT, ['game/docs/engineering/codex-knowledge']));
for (const file of new Set(['AGENTS.md', 'CONVENTIONS.md', 'README.md', ...markdownFiles(ROOT, ['.agents', '.codex', 'docs', 'game', 'plan', 'shared'])])) {
  for (const dependency of legacyDependencies(read(file), file)) check(false, `Legacy reading dependency ${file}: ${dependency}`);
}
for (const name of fs.readdirSync(path.join(ROOT, '.github/workflows')).filter(n => /\.ya?ml$/.test(n))) {
  const file = `.github/workflows/${name}`;
  for (const dependency of legacyDependencies(read(file), file)) check(false, `Legacy CI dependency ${file}: ${dependency}`);
}
for (const name of fs.readdirSync(path.join(ROOT, '.codex/agents')).filter(n => n.endsWith('.toml'))) {
  const file = `.codex/agents/${name}`;
  for (const dependency of legacyDependencies(read(file), file)) check(false, `Unsupported agent source ${file}: ${dependency}`);
}
for (const {name, file} of skills) {
  check(exists(file), `Missing skill entrypoint: ${file}`);
  if (!exists(file)) continue;
  const text = read(file);
  const front = /^---\r?\nname: ([a-z0-9-]+)\r?\ndescription: ([^\r\n]+)\r?\n---/.exec(text);
  check(front?.[1] === name,`Invalid skill frontmatter: ${name}`);
  check((front?.[2].length ?? 0)>20 && (front?.[2].length ?? 1025)<=1024,`Invalid description: ${name}`);
  check(!/\$ARGUMENTS|AskUserQuestion|subagent_type|updatedToolOutput|\b(?:sonnet|opus|haiku)\b|\/(?:code-review|simplify|run)\b/.test(text),`Unsupported foreign mechanism in ${name}`);
  check(!/\[TODO:/.test(text),`Scaffold in ${name}`);
}
for (const file of markdown) {
  if (!exists(file)) { check(false, `Missing instruction document: ${file}`); continue; }
  const text=read(file);
  for(const m of text.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
    const target=m[1].replace(/^<|>$/g,'').split('#')[0];
    if (!target || /^(https?:|mailto:)/.test(target)) continue;
    check(fs.existsSync(path.resolve(ROOT,path.dirname(file),target)),`Broken link ${file}: ${target}`);
  }
}
const migration = JSON.parse(read('docs/engineering/skill-migration.json'));
// Historical source names are provenance, never filesystem dependencies.
check(migration.length===26 && new Set(migration.map(x=>x.source)).size===26,'Historical migration manifest must retain 26 unique entries');
for(const row of migration) {
  check(exists(row.new_location),`Missing migration target: ${row.new_location}`);
  for(const field of ['purpose','trigger','input','output','write_scope','dependencies','side_effects','transfer','verification']) check(row[field] !== undefined,`Missing ledger field ${field}`);
}
const hooks=JSON.parse(read('.codex/hooks.json'));
check(!hooks.hooks.Stop,'Stop continuation is intentionally absent');
for(const event of ['SessionStart','PreToolUse','PostToolUse']) {
  check(Array.isArray(hooks.hooks[event]),`Missing hook event ${event}`);
  for(const group of hooks.hooks[event]??[]) for(const handler of group.hooks??[]) {
    check(handler.type==='command'&&handler.timeout===10,`Invalid handler ${event}`);
    check(handler.command.includes('scripts/codex/hook.mjs')&&handler.commandWindows.includes('scripts/codex/hook.mjs'),`Missing cross-platform entry ${event}`);
  }
}
for(const name of ['economy-reviewer','economy-balance-runner','mqx-ui-reviewer']) {
  const text=read(`.codex/agents/${name}.toml`);
  check(text.includes(`name = "${name}"`)&&text.includes('developer_instructions = """'),`Invalid agent card ${name}`);
  check(!/^model\s*=/m.test(text),`Unexpected model override ${name}`);
}
check(ddlOnly(read(BASELINE)),'Baseline is not within conservative DDL-only subset');
if(process.argv.includes('--protected')) console.log('Legacy --protected snapshot retired; checking Codex architecture only (no historical source reads).');
if(failures.length) { for(const failure of failures) console.error(`FAIL: ${failure}`); process.exitCode=1; }
else console.log(`PASS: ${skills.length} skills (${skillScopes.map(scope => `${scope || 'root'}=${skillsInScope(ROOT, scope).length}`).join(', ')}), ${migration.length} source mappings, ${markdown.length} Markdown files, hooks/agents and DDL baseline`);
