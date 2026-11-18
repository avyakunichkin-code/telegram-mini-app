import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { apiCommand, projectPython, projectPorts } from './lib/project-runtime.mjs';

test('product runtime never silently uses root or sibling Python', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'project-runtime-'));
  try {
    const relative = process.platform === 'win32' ? 'Scripts/python.exe' : 'bin/python';
    for (const scope of ['', 'game']) {
      const file = path.join(root, scope, '.venv', relative);
      fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, 'synthetic');
    }
    assert.equal(projectPython(root, 'game'), path.join(root, 'game/.venv', relative));
    assert.throws(() => projectPython(root, 'plan'), /Missing plan\/\.venv/);
    assert.equal(projectPython(root, 'plan', 'explicit-python'), 'explicit-python');
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});

test('PLAN starts the actual factory and GAME retains its app entrypoint', () => {
  const plan = apiCommand('/synthetic', 'plan', { python: 'synthetic-python', reload: false });
  assert.ok(plan.args.includes('plan_api.main:create_app'));
  assert.ok(plan.args.includes('--factory'));
  assert.ok(!plan.args.includes('--reload'));
  const game = apiCommand('/synthetic', 'game', { python: 'synthetic-python' });
  assert.ok(game.args.includes('main:app'));
  assert.ok(!game.args.includes('--factory'));
  assert.notEqual(projectPorts('game', {}).api, projectPorts('plan', {}).api);
  assert.notEqual(projectPorts('game', {}).web, projectPorts('plan', {}).web);
});

test('parallel worktrees can override ports without allowing command fragments', () => {
  assert.deepEqual(projectPorts('plan', { PROJECT_API_PORT: '18020', PROJECT_WEB_PORT: '15190' }), { api: 18020, web: 15190 });
  for (const value of ['8020; echo x', '0', 'NaN', '65536']) assert.throws(() => projectPorts('plan', { PROJECT_API_PORT: value }));
});
