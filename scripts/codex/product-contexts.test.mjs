import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { ROOT } from './policy.mjs';

// Run the generated hub script: search and archive must preserve product scope,
// and Plan must not instantiate Game parity iframes, even hidden ones.
function hub(search) {
  const html = fs.readFileSync(path.join(ROOT, 'design-lab/index.html'), 'utf8');
  const script = /<script>([\s\S]*?)<\/script>/.exec(html)[1];
  const elements = new Map();
  const element = id => {
    if (!elements.has(id)) elements.set(id, { innerHTML: '', value: '', setAttribute() {}, addEventListener(type, fn) { this[type] = fn; } });
    return elements.get(id);
  };
  const events = {};
  const location = { search, href: `http://localhost/index.html${search}` };
  vm.runInNewContext(script, {
    document: { getElementById: element, querySelector: element, addEventListener(type, fn) { events[type] = fn; } },
    location, URL, URLSearchParams, history: { replaceState(_state, _title, url) { location.href = String(url); } },
  });
  return { element, events, location };
}

test('Plan lab search and archive never expose Game links or instantiate Game parity', () => {
  const { element, events, location } = hub('?product=plan');
  const links = () => [...element('root').innerHTML.matchAll(/href="\.\/([^"]+)"/g)].map(m => m[1]);
  assert.ok(links().length > 0);
  assert.ok(links().every(href => href.startsWith('plan-checkup/')));
  assert.equal(element('quick').innerHTML, '');
  element('q').value = 'dashboard'; element('q').input();
  assert.deepEqual(links(), []);
  element('q').value = ''; element('q').input();
  events.click({ target: { closest(selector) { return selector === '[data-archive-toggle]' ? {} : null; } } });
  assert.equal(new URL(location.href).searchParams.get('product'), 'plan');
  assert.ok(links().every(href => href.startsWith('plan-checkup/')));
});

test('Game lab excludes Plan; unfiltered hub retains both products', () => {
  const game = hub('?product=game').element('root').innerHTML;
  assert.match(game, /dashboard\//);
  assert.doesNotMatch(game, /href="\.\/plan-checkup\//);
  assert.match(hub('').element('root').innerHTML, /href="\.\/plan-checkup\//);
});

test('product documentation entries and scoped instructions have resolving local links', () => {
  const files = ['docs/README.md', 'docs/game/CATALOG.md', 'docs/plan/README.md',
    'docs/game/README.md', 'docs/game/DESIGN.md', 'docs/plan/DESIGN.md',
    'docs/decisions/ADR-018-product-work-contexts.md', 'apps/plan-web/README.md', 'tests/shared-ui/README.md'];
  for (const file of files) {
    const content = fs.readFileSync(path.join(ROOT, file), 'utf8');
    for (const m of content.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
      const target = m[1].split(/[?#]/)[0];
      if (!target || /^https?:/.test(target)) continue;
      assert.ok(fs.existsSync(path.resolve(ROOT, path.dirname(file), target)), `${file}: ${target}`);
    }
  }
});
