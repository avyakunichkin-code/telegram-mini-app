import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { ROOT, BASELINE, ddlOnly } from './policy.mjs';

const failures = [];
const check = (ok, message) => { if (!ok) failures.push(message); };
const read = p => fs.readFileSync(path.join(ROOT,p),'utf8');
const exists = p => fs.existsSync(path.join(ROOT,p));
const skills = fs.readdirSync(path.join(ROOT,'.agents/skills'),{withFileTypes:true}).filter(x=>x.isDirectory()).map(x=>x.name);
check(skills.length === 13,'Expected 13 project skills');
const markdown = ['AGENTS.md',...skills.map(n=>`.agents/skills/${n}/SKILL.md`),...fs.readdirSync(path.join(ROOT,'docs/ai')).filter(n=>n.endsWith('.md')).map(n=>`docs/ai/${n}`)];
for (const name of skills) {
  const text = read(`.agents/skills/${name}/SKILL.md`);
  const front = /^---\r?\nname: ([a-z0-9-]+)\r?\ndescription: ([^\r\n]+)\r?\n---/.exec(text);
  check(front?.[1] === name,`Invalid skill frontmatter: ${name}`);
  check((front?.[2].length ?? 0)>20 && (front?.[2].length ?? 1025)<=1024,`Invalid description: ${name}`);
  check(!/\$ARGUMENTS|AskUserQuestion|subagent_type|updatedToolOutput|\b(?:sonnet|opus|haiku)\b|\/(?:code-review|simplify|run)\b/.test(text),`Unsupported Claude mechanism in ${name}`);
  check(!/\[TODO:/.test(text),`Scaffold in ${name}`);
}
for (const file of markdown) {
  const text=read(file);
  for(const m of text.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
    const target=m[1].replace(/^<|>$/g,'').split('#')[0];
    if (!target || /^(https?:|mailto:)/.test(target)) continue;
    check(fs.existsSync(path.resolve(ROOT,path.dirname(file),target)),`Broken link ${file}: ${target}`);
  }
}
const migration = JSON.parse(read('docs/ai/skill-migration.json'));
const sources = fs.readdirSync(path.join(ROOT,'.claude/skills'),{withFileTypes:true}).filter(x=>x.isDirectory()&&exists(`.claude/skills/${x.name}/SKILL.md`)).map(x=>x.name);
check(sources.length===26 && migration.length===sources.length,'Source skill count drift');
for(const name of sources) check(migration.some(x=>x.source===`.claude/skills/${name}/SKILL.md`),`Unmapped source ${name}`);
for(const row of migration) {
  check(exists(row.new_location),`Missing migration target: ${row.new_location}`);
  for(const field of ['purpose','trigger','input','output','write_scope','dependencies','side_effects','transfer','verification']) check(row[field] !== undefined,`Missing ledger field ${field}`);
}
const hooks=JSON.parse(read('.codex/hooks.json'));
check(!exists('.codex/config.toml'),'Review config.toml for duplicated inline hooks before adding a second registration representation');
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
if(process.argv.includes('--protected')) {
  const before=JSON.parse(read('docs/ai/protected-before.json'));
  const skip=new Set(['worktrees','node_modules','.git','.venv','__pycache__','.cache','logs']);
  const current={};
  function walk(p,inside=false) {
    if(!fs.existsSync(p)) return;
    if(fs.statSync(p).isDirectory()) {
      for(const e of fs.readdirSync(p,{withFileTypes:true})) if(!skip.has(e.name)) walk(path.join(p,e.name),true);
    } else {
      current[path.relative(ROOT,p).replaceAll('\\','/')]=crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
    }
  }
  for(const p of ['CLAUDE.md','.claude','.cursor','frontend-react/.claude','.git/hooks']) walk(path.join(ROOT,p));
  for(const key of new Set([...Object.keys(before),...Object.keys(current)])) check(before[key]===current[key],`Protected file changed/added/deleted: ${key}`);
  console.log(`Protected snapshot: ${Object.keys(current).length} files compared`);
}
if(failures.length) { for(const failure of failures) console.error(`FAIL: ${failure}`); process.exitCode=1; }
else console.log(`PASS: ${skills.length} skills, ${migration.length} source mappings, ${markdown.length} Markdown files, hooks/agents and DDL baseline`);
