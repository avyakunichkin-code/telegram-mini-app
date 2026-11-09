import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { Script } from 'node:vm';

const root = new URL('./', import.meta.url);
const registry = JSON.parse(readFileSync(new URL('tasks.json', root), 'utf8'));
const tasks = registry.filter(task => task.ownerAction !== false);
const html = readFileSync(new URL('index.html', root), 'utf8');

test('personal queue excludes engineering work and reference history', () => {
  assert.ok(tasks.every(task => task.ownerAction === true));
  assert.ok(tasks.every(task => task.type !== 'Поручение разработке' && task.status !== 'done'));
  assert.equal(tasks.length, 23);
  for (const task of registry.filter(task => task.ownerAction === false)) {
    assert.ok(!html.includes('"id":"' + task.id + '"'));
  }
});

test('owner registry has unique IDs, complete actions and existing evidence', () => {
  assert.equal(new Set(tasks.map(task => task.id)).size, tasks.length);
  for (const task of tasks) {
    assert.match(task.id, /^GAME-OWNER-\d{2}$/);
    assert.ok(['ready', 'waiting', 'later', 'done'].includes(task.status));
    assert.ok([1, 2, 3].includes(task.priority));
    for (const key of ['title', 'action', 'done', 'type', 'dependency', 'source']) assert.ok(task[key]?.trim());
    for (const [, link] of [['source', task.source], ...(task.links || [])]) {
      assert.ok(link.startsWith('../'));
      assert.ok(existsSync(new URL(link, root)), link);
    }
    const card = readFileSync(new URL(`items/${task.id}.md`, root), 'utf8');
    assert.ok(card.includes(task.title) && card.includes(task.action));
  }
});

test('all local Markdown and static HTML links in the task folder resolve', () => {
  const files = [...readdirSync(root).filter(file => file.endsWith('.md')),
    ...readdirSync(new URL('items/', root)).map(file => `items/${file}`)];
  for (const file of files) {
    const base = new URL(file, root);
    const content = readFileSync(base, 'utf8');
    for (const [, link] of content.matchAll(/\]\(([^)]+)\)/g)) {
      if (/^https?:\/\//.test(link)) continue;
      assert.ok(existsSync(new URL(link.split('#')[0], base)), `${file}: ${link}`);
    }
  }
  for (const [, link] of html.matchAll(/href="([^"]+)"/g)) {
    assert.ok(existsSync(new URL(link.split('#')[0], root)), link);
  }
});

test('offline page embeds the actual registry and compiles without remote requests', () => {
  const code = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  new Script(code);
  const embedded = JSON.parse(code.match(/const tasks=(.*);/)[1]);
  assert.deepEqual(embedded, tasks);
  assert.ok(code.includes('tvoy-game.owner-tasks.v1'));
  assert.ok(!code.includes('tvoy-plan.owner-tasks.v1'));
  assert.ok(!/fetch\(|XMLHttpRequest|https?:\/\//.test(code));
  assert.ok(html.includes('../../plan/tasks/index.html'));
});
