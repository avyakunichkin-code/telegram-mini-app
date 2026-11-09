import {chromium} from '../../landing/node_modules/playwright/index.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
await fs.mkdir(new URL('./qa/',import.meta.url),{recursive:true});
try{
for(const width of [1440,390]){
 await page.setViewportSize({width,height:1000});
 await page.goto('http://127.0.0.1:4175/landing-narrator-poses-round/site/index.html');
 await page.evaluate(()=>document.querySelectorAll('img,iframe').forEach(n=>n.loading='eager'));
 await page.waitForFunction(()=>[...document.images].every(n=>n.complete&&n.naturalWidth>0));
 const pairs=[['.student-guide','.section-presenter h2','left'],['.professional-guide .narrator>img','.professional-guide .narrator>div','right'],['.choice-section .narrator>img','.choice-section .narrator>div','left'],['.roadmap .narrator>img','.roadmap .narrator>div','right']];
 for(const [image,copy,side] of pairs){
  const a=await page.locator(image).boundingBox(),b=await page.locator(copy).boundingBox();
  assert(a&&b);assert(a.x>=0&&a.x+a.width<=width+1,image+' clipped');
  assert(side==='left'?a.x+a.width<=b.x+2:b.x+b.width<=a.x+2,image+' wrong side/overlap');
 }
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 for(const id of ['interface','try','roadmap'])await page.locator('#'+id).screenshot({path:fileURLToPath(new URL(`./qa/${id}-${width}.png`,import.meta.url))});
 await page.locator('[data-choice=trip]').click();assert(await page.locator('#result').isVisible());await page.locator('#reset').click();assert(await page.locator('.choices').isVisible());
}
assert.deepEqual(errors,[]);console.log('PASS: 1440/390; left/right alternation, no overlap/overflow, assets and interaction.');
}finally{await browser.close()}
