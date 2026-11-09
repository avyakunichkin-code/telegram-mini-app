import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
const round=path.dirname(fileURLToPath(import.meta.url));
const require=createRequire(path.resolve(round,'../../../frontend-react/package.json'));
const {chromium}=require('@playwright/test');
const browser=await chromium.launch({channel:'chrome'});
let checks=0;
try{
 const page=await browser.newPage();
 for(const reducedMotion of ['reduce','no-preference'])for(const [width,height] of [[360,640],[390,744],[1440,950]])for(const theme of ['light','dark'])for(const product of ['deposit','bond']){
  await page.emulateMedia({reducedMotion});await page.setViewportSize({width,height});
  await page.goto('http://127.0.0.1:4178/capital-page/first-investment-round/');
  await page.selectOption('#theme',theme);await page.evaluate(()=>document.fonts.ready);
  await page.locator(`#preview [data-do=${product}]`).click();
  const dialog=page.getByRole('dialog');
  assert.equal(await dialog.getAttribute('aria-modal'),'true');
  assert.equal(await dialog.locator('h2').evaluate(el=>document.activeElement===el),true,'focus enters heading');
  assert.equal(await dialog.evaluate(el=>getComputedStyle(el).animationName),reducedMotion==='reduce'?'none':'sheet-rise');
  await page.keyboard.press('Tab');
  assert.equal(await dialog.locator('.close').evaluate(el=>document.activeElement===el),true);
  await page.keyboard.press('Shift+Tab');
  assert.equal(await dialog.locator('[data-amount="10000"]').evaluate(el=>document.activeElement===el),true,'trap wraps past disabled submit');
  await dialog.locator('#amount').fill('10000');
  assert.equal(await dialog.evaluate(el=>getComputedStyle(el).animationName),'none','editing does not replay entrance');
  const box=await dialog.boundingBox();assert.ok(Math.abs(box.y+box.height-height)<2,'bottom anchored');assert.ok(box.height<=400,'compact normal form at most 400px');
  assert.equal(await dialog.locator('.sheet-footer').evaluate(el=>el.getBoundingClientRect().bottom<=innerHeight),true);
  if(width===390&&theme==='light'&&reducedMotion==='reduce')await page.screenshot({path:path.join(round,`qa/compact-${product}.png`)});
  await page.keyboard.press('Escape');
  assert.equal(await dialog.count(),0);
  assert.equal(await page.locator(`#preview [data-do=${product}]`).evaluate(el=>document.activeElement===el),true,'focus restored');
  checks++;
 }
 await page.goto('http://127.0.0.1:4178/capital-page/first-investment-round/?product=deposit&amount=10000');
 await page.locator('.scrim').click({position:{x:4,y:4}});assert.equal(await page.getByRole('dialog').count(),0);
 console.log(`PASS: ${checks} bottom-sheet cases: motion/reduced motion, focus trap/restore, bottom anchor, fixed CTA; scrim close.`);
}finally{await browser.close();}
