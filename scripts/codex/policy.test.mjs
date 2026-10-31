import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { ROOT, BASELINE, decide, patchOperations, relativeTarget, ddlOnly } from './policy.mjs';

const patch = body => ({ tool_name: 'apply_patch', tool_input: { command: `*** Begin Patch\n${body}\n*** End Patch` }, cwd: ROOT });
const blocked = event => { try { return Boolean(decide(event)); } catch { return true; } };
test('all patch operations, multiple files and moves', () => {
  assert.equal(blocked(patch('*** Add File: docs/ai/example.md\n+x')), false);
  for (const op of ['Add', 'Update', 'Delete']) assert.equal(blocked(patch(`*** ${op} File: design-lab/index.html\n+x`)), true);
  assert.equal(blocked(patch('*** Update File: docs/ai/example.md\n*** Move to: design-lab/index.html\n+x')), true);
  assert.equal(blocked(patch(`*** Update File: ${BASELINE}\n*** Move to: docs/ai/example.sql\n+x`)), true);
  assert.equal(blocked(patch('*** Update File: docs/ai/example.md\n+x\n*** Update File: design-lab/a/lab-base.css\n+y')), true);
  assert.equal(patchOperations('*** Begin Patch\r\n*** Delete File: x\r\n*** End Patch').length, 1);
});
test('round authoring is allowed, generated paths and protected architecture are blocked', () => {
  for (const target of ['design-lab/a/round/index.html', 'design-lab/a/round/styles.css']) assert.equal(blocked(patch(`*** Add File: ${target}\n+x`)), false);
  for (const target of ['design-lab/lab-base.css', '.claude/settings.json', 'frontend-react/.claude/skills/a/SKILL.md', 'CLAUDE.md', '.git/hooks/pre-commit']) assert.equal(blocked(patch(`*** Delete File: ${target}`)), true);
});
test('Windows spaces, case, relative paths, traversal, UNC and alternate stream', () => {
  const root = 'C:\\Users\\A Person\\repo';
  assert.equal(relativeTarget('C:\\Users\\A Person\\repo\\DESIGN-LAB\\index.html', root, root), 'design-lab/index.html');
  assert.equal(relativeTarget('../design-lab/a/styles.css', root + '\\frontend-react', root), 'design-lab/a/styles.css');
  for (const p of ['../../escape', 'C:\\outside\\x', 'C:foo', '\\\\server\\share', 'x:stream']) assert.throws(() => relativeTarget(p, root, root));
});
test('SQL DDL-only subset and bypass attempts', () => {
  for (const sql of ['CREATE TABLE t(id int);', '-- INSERT x\nCREATE TABLE t(id int REFERENCES p ON DELETE CASCADE);', "COMMENT ON TABLE t IS 'INSERT words';"]) assert.equal(ddlOnly(sql), true);
  for (const sql of ['INSERT INTO t VALUES(1)', 'CREATE TABLE t(id int);\n UPDATE t SET id=2', 'WITH x AS (DELETE FROM t RETURNING *) SELECT * FROM x;', 'COPY t FROM STDIN;', "DO $$ BEGIN EXECUTE 'UPDATE t SET x=1'; END $$;", 'CREATE TABLE t AS SELECT 1;', '-- >>> 0042_x.sql\nCREATE TABLE t(id int);']) assert.equal(ddlOnly(sql), false);
  assert.equal(blocked(patch(`*** Update File: ${BASELINE}\n@@\n+INSERT INTO t VALUES(1);`)), true);
  for (const sql of ["COMMENT ON TABLE t IS '--'; INSERT INTO t VALUES (1);", "COMMENT ON TABLE t IS '/*'; UPDATE t SET id=1;", "COMMENT ON TABLE t IS 'unterminated", '/* unterminated']) assert.equal(ddlOnly(sql),false);
  assert.equal(ddlOnly("/* outer /* inner */ end */ CREATE TABLE t(id int);"),true);
});
test('missing targets and unknown mutating MCP never silently pass', () => {
  for (const event of [{}, { tool_name:'apply_patch', tool_input:{} }, { tool_name:'Write', tool_input:{} }, { tool_name:'mcp__fs__write_file', tool_input:{} }, { tool_name:'mcp__remote__execute', tool_input:{} }]) assert.equal(blocked(event), true);
  assert.equal(blocked({ tool_name:'mcp__fs__read_file', tool_input:{path:'docs/ai/example.md'} }), false);
  assert.equal(blocked({tool_name:'mcp__fs__rename_file',tool_input:{path:'docs/ai/example.md',new_path:'.claude/settings.json'},cwd:ROOT}),true);
  assert.equal(blocked({tool_name:'Move',tool_input:{file_path:'docs/ai/example.md',destination:'design-lab/index.html'},cwd:ROOT}),true);
  assert.equal(blocked({tool_name:'Rename',tool_input:{file_path:'docs/ai/example.md'},cwd:ROOT}),true);
  assert.equal(blocked({tool_name:'Delete',tool_input:{file_path:BASELINE},cwd:ROOT}),true);
});
test('exact generator commands only; word generator grants nothing', () => {
  const shell = (cmd, workdir=path.join(ROOT,'frontend-react')) => ({tool_name:'exec_command',tool_input:{cmd,workdir}});
  assert.equal(blocked(shell('npm run design-lab:build-nav')), false);
  assert.equal(blocked(shell('npm.cmd run design-lab:sync-round -- design-lab/a/round')), false);
  for (const cmd of ['echo generator > ../design-lab/index.html', 'npm run design-lab:build-nav; echo x', 'npm run design-lab:sync-round -- design-lab/../../escape', 'powershell -EncodedCommand AAA']) assert.equal(blocked(shell(cmd)), true);
  assert.equal(blocked(shell('npm run design-lab:build-nav', ROOT)), true);
});
test('executable smoke: pre adapter gates a real stub before side effect', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(),'codex-gate-'));
  const marker = path.join(tmp,'marker');
  try {
    function invoke(event) {
      const gate = spawnSync(process.execPath,[path.join(ROOT,'scripts/codex/hook.mjs'),'pre'],{input:JSON.stringify(event),encoding:'utf8'});
      if(gate.status===0) spawnSync(process.execPath,['-e',"require('fs').writeFileSync(process.argv[1],'stub')",marker]);
      return gate;
    }
    assert.equal(invoke(patch('*** Add File: docs/ai/synthetic.md\n+synthetic')).status,0);
    assert.equal(fs.readFileSync(marker,'utf8'),'stub'); fs.unlinkSync(marker);
    assert.equal(invoke(patch('*** Update File: design-lab/index.html\n+synthetic')).status,2);
    assert.equal(fs.existsSync(marker),false);
    for (const raw of ['not json','{}',JSON.stringify({tool_name:'Write',tool_input:{content:'SYNTHETIC_SECRET_DO_NOT_ECHO'}})]) {
      const result=spawnSync(process.execPath,[path.join(ROOT,'scripts/codex/hook.mjs'),'pre'],{input:raw,encoding:'utf8'});
      assert.equal(result.status,2); assert.doesNotMatch(result.stdout+result.stderr,/SYNTHETIC_SECRET_DO_NOT_ECHO/);
    }
  } finally { fs.rmSync(tmp,{recursive:true,force:true}); }
});
test('runner preserves failure exit and complete output in local log', () => {
  const result=spawnSync(process.execPath,[path.join(ROOT,'scripts/codex/run-check.mjs'),'--',process.execPath,'-e',"console.log('HEAD_MARKER'+ 'x'.repeat(10000)); console.error('TAIL_MARKER'); process.exit(7)"],{encoding:'utf8'});
  assert.equal(result.status,7);
  const log=/Full log: (.+)/.exec(result.stdout)?.[1].trim(); assert.ok(log);
  const full=fs.readFileSync(log,'utf8'); assert.match(full,/HEAD_MARKER/); assert.match(full,/TAIL_MARKER/);
  assert.ok(result.stdout.length<7000); fs.unlinkSync(log);
});
test('registered Windows wrapper forwards stdin, spaces in root and exit code', {skip:process.platform!=='win32'}, () => {
  const config=JSON.parse(fs.readFileSync(path.join(ROOT,'.codex/hooks.json'),'utf8'));
  const registered=config.hooks.PreToolUse[0].hooks[0].commandWindows;
  const command=registered.replace(/^powershell\.exe -NoProfile -Command "/,'').replace(/"$/,'');
  for(const [event,expected] of [[patch('*** Add File: docs/ai/synthetic.md\n+x'),0],[patch('*** Delete File: design-lab/index.html'),2]]) {
    const result=spawnSync('powershell.exe',['-NoProfile','-Command',command],{cwd:path.join(ROOT,'backend'),input:JSON.stringify(event),encoding:'utf8'});
    assert.equal(result.status,expected,result.stderr);
  }
});
test('session and post hooks emit supported context, throttle outside Claude', () => {
  const script=path.join(ROOT,'scripts/codex/hook.mjs');
  const session=spawnSync(process.execPath,[script,'session'],{input:'{}',encoding:'utf8'});
  assert.equal(JSON.parse(session.stdout).hookSpecificOutput.hookEventName,'SessionStart');
  const payload=JSON.stringify(patch('*** Add File: backend/tests/synthetic.py\n+x'));
  const post=spawnSync(process.execPath,[script,'post'],{input:payload,encoding:'utf8'});
  assert.equal(post.status,0);
  if(post.stdout) assert.equal(JSON.parse(post.stdout).hookSpecificOutput.hookEventName,'PostToolUse');
  const repeat=spawnSync(process.execPath,[script,'post'],{input:payload,encoding:'utf8'});
  assert.equal(repeat.status,0); assert.equal(repeat.stdout,'');
  const state=JSON.parse(fs.readFileSync(path.join(ROOT,'.codex-state/hint-throttle.json'),'utf8'));
  assert.ok(Object.values(state).some(x=>typeof x==='number'));
});
test('timeout/failure belongs to host; no Stop continuation registered', () => {
  const config=JSON.parse(fs.readFileSync(path.join(ROOT,'.codex/hooks.json'),'utf8'));
  assert.equal(config.hooks.Stop,undefined);
  const timed=spawnSync(process.execPath,['-e','setInterval(()=>{},1000)'],{timeout:50,encoding:'utf8'});
  assert.equal(timed.status,null); assert.equal(timed.error?.code,'ETIMEDOUT');
  // This proves the harness timeout, not a fail-closed native Codex runtime.
});
