import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const previewUrl=process.argv[2]||'http://127.0.0.1:4178/';
const published=previewUrl.startsWith('https://');
const out=path.join(root,'design-lab/landing-refresh-20261030',published?'qa-published':'qa-soft-volume');
await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000},locale:'ru-RU'});
const errors=[],httpErrors=[],checks=[];
page.on('pageerror',e=>errors.push(e.message));
page.on('response',r=>{if(r.status()>=400)httpErrors.push(`${r.status()} ${r.url()}`)});
try{
  for(const width of [1440,390]){
    await page.setViewportSize({width,height:1000});
    await page.goto(previewUrl);
    await page.evaluate(()=>{
      document.querySelectorAll('img,iframe').forEach(el=>el.loading='eager');
    });
    await page.evaluate(()=>document.fonts.ready);
    await page.waitForFunction(()=>[...document.images].every(i=>i.complete&&i.naturalWidth>0));
    const narrators=page.locator('.student-guide, .narrator img');
    assert.equal(await narrators.count(),4);
    assert.deepEqual(await narrators.evaluateAll(nodes=>nodes.map(n=>n.alt)),['Студент','Профессионал','Руководитель','Предприниматель']);
    assert.ok(await narrators.evaluateAll(nodes=>nodes.every(n=>n.naturalHeight===560)));
    for(const [image,copy,side] of [
      ['.student-guide','.section-presenter h2','left'],
      ['.professional-guide .narrator>img','.professional-guide .narrator>div','right'],
      ['.choice-section .narrator>img','.choice-section .narrator>div','left'],
      ['.roadmap .narrator>img','.roadmap .narrator>div','right'],
    ]){
      const a=await page.locator(image).boundingBox(),b=await page.locator(copy).boundingBox();
      assert(a&&b);
      assert(side==='left'?a.x+a.width<=b.x+2:b.x+b.width<=a.x+2,image+' must alternate without overlap');
    }
    assert.equal(await page.locator('img[src$="-chibi.svg"]').count(),0);
    assert.match(await page.locator('.monetka').getAttribute('src'),/monetka-soft-volume.webp$/);
    await page.locator('.monetka').screenshot({path:path.join(out,`monetka-${width}.png`)});
    assert.equal(await page.locator('.step-kvitya').count(),1);
    await page.locator('#how').screenshot({path:path.join(out,`kvitya-${width}.png`)});
    const frame=page.frameLocator('iframe[title="Финансы — текущий канон"]');
    const avatar=frame.locator('img').first();
    await avatar.waitFor();
    assert.match(await avatar.getAttribute('src'),/student-mascot-avatar\.png$/);
    await avatar.evaluate(i=>i.decode());
    const cells=await frame.locator('.mqx-bg-money__cell').evaluateAll(nodes=>nodes.map(n=>({border:getComputedStyle(n).borderTopWidth,shadow:getComputedStyle(n).boxShadow,bg:getComputedStyle(n).backgroundColor})));
    assert.equal(cells.length,3);
    for(const cell of cells)assert.deepEqual(cell,{border:'0px',shadow:'none',bg:'rgba(0, 0, 0, 0)'});
    const turn=page.frameLocator('iframe[title="Карта хода — текущий канон"]');
    assert.equal(await turn.locator('.mqx-bg-turn').evaluate(n=>getComputedStyle(n).borderTopWidth),'2px');
    for(const frameTitle of ['Карта хода — текущий канон','Финансы — текущий канон']){
      const embedded=page.frameLocator(`iframe[title="${frameTitle}"]`);
      assert.equal(await embedded.locator('body').evaluate(n=>n.scrollHeight<=innerHeight),true,'preview must fit frame');
    }
    assert.deepEqual(await page.locator('.landing-need meter').evaluateAll(nodes=>nodes.map(n=>getComputedStyle(n).height)),['6px','6px']);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth),false);
    for(const selector of ['#interface','.professional-guide','#try','#roadmap']){
      await page.locator(selector).screenshot({path:path.join(out,`${selector.replace(/[^a-z]/g,'')}-${width}.png`)});
    }
    // The interactive example remains usable after the artwork swap.
    for(const choice of ['trip','save','meet']){
      await page.locator(`[data-choice=${choice}]`).click();
      await page.locator('#result').waitFor({state:'visible'});
      assert.equal(await page.locator('#result').isVisible(),true);
      assert.equal(await page.locator('.choices').isVisible(),false);
      await page.locator('#reset').click();
      assert.equal(await page.locator('.choices').isVisible(),true);
    }
    for(const selector of ['.student-guide','.professional-guide .narrator>img','.choice-section .narrator>img','.roadmap .narrator>img']){
      const img=page.locator(selector);
      assert.equal(await img.count(),1);
      const box=await img.boundingBox();
      assert.ok(box&&box.width>0&&box.height>0);
      assert.ok(box.x>=-1&&box.x+box.width<=width+1,`Clipped narrator ${selector}`);
    }
    checks.push({width,narrators:4,retinaHeight:560,avatar:'B',overflow:false,choicesAndReset:'passed'});
  }
  assert.deepEqual(errors,[]);assert.deepEqual(httpErrors,[]);
  await fs.writeFile(path.join(out,'verification.json'),JSON.stringify({ok:true,checks,errors,httpErrors,source:previewUrl,published},null,2)+'\n');
  console.log('PASS: landing build at 1440/390px; four B narrators, embedded B avatar, no missing images/overflow, all choices/reset work.');
}finally{await browser.close()}
