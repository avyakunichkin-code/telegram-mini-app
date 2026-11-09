import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const manifest=JSON.parse(await fs.readFile(new URL('../../design-lab/nav.manifest.json',import.meta.url),'utf8'));
const browser=await chromium.launch({channel:'chrome',headless:true});
try {
  const page=await browser.newPage();
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:4175/');
  const hrefs=()=>page.locator('#root a.card').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('href').replace(/^\.\//,'')));
  const current=await hrefs();
  assert(current.includes('dashboard/current-page-round/index.html'));
  assert(!current.includes('board-game/ink-refinement-round/index.html'),'closed refinement is archived');
  for(const href of manifest.archive.paths)assert(!current.includes(href),href+' leaked into current');
  await page.locator('[data-archive-toggle]').click();
  assert(page.url().endsWith('?archive=1'));
  const archived=await hrefs();
  for(const href of manifest.archive.paths)assert(archived.includes(href),href+' missing from archive');
  assert(!archived.includes('dashboard/current-page-round/index.html'));
  await page.reload();
  assert.deepEqual(await hrefs(),archived,'archive deep link survives reload');
  for(const href of archived)assert.equal((await page.request.get('http://127.0.0.1:4175/'+href)).status(),200,href);
  await page.locator('[data-archive-toggle]').click();
  assert.deepEqual(await hrefs(),current);
  await page.goto('http://127.0.0.1:4175/board-game/ink-refinement-round/?rev=approved-hierarchy-20261104');
  await page.waitForURL('**/dashboard/current-page-round/');
  assert.equal(await page.locator('#dashboard').count(),1,'old round opens the current canon');
  assert.deepEqual(errors,[]);
  console.log(`PASS: ${current.length} current, ${archived.length} archived; navigation, reload and archive links.`);
} finally {await browser.close();}
