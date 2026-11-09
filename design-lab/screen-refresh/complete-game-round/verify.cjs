const {chromium}=require('../../../frontend-react/node_modules/@playwright/test');
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-proxy-server']});
 const p=await browser.newPage({viewport:{width:1440,height:1100},reducedMotion:'reduce'});
 const errors=[],failed=[];
 p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400)failed.push(r.url()+':'+r.status());});
 await p.goto('http://127.0.0.1:4188/screen-refresh/complete-game-round/');await p.evaluate(()=>document.fonts.ready);
 await p.locator('.persona-art').evaluate(i=>i.decode());
 const qa=path.join(__dirname,'qa');fs.mkdirSync(qa,{recursive:true});
 await p.screenshot({path:path.join(qa,'desktop-home.png'),fullPage:true});
 let states=0;
 for(const width of [1440,390,320]){await p.setViewportSize({width,height:1000});
  for(const direction of ['bold','bridge']){await p.selectOption('#direction',direction);
   for(const page of ['home','capital','analytics','menu']){await p.evaluate(id=>document.querySelector(`[data-page="${id}"]`).click(),page);
    for(const state of ['normal','risk','loading','empty','error','disabled']){await p.selectOption('#condition',state);assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`${width} ${direction} ${page} ${state}`);states++;}
   }
  }
 }
 await p.selectOption('#direction','bold');await p.selectOption('#condition','normal');await p.evaluate(()=>document.querySelector('[data-page="home"]').click());
 for(const width of [1440,390,320]){await p.setViewportSize({width,height:1000});
  for(const action of ['events','fund','withdraw','invest','close','goal','needs','flows','expenses','achievements','settings','about','newgame','feedback','bond','property','car','insurance','credit','mortgage','finale']){
   await p.evaluate(action=>{const button=document.createElement('button');button.dataset.action=action;document.body.append(button);button.click();button.remove();},action);
   await p.locator('[role=dialog]').waitFor();
   assert.equal(await p.locator('.modal').evaluate(el=>el.scrollWidth>el.clientWidth),false,`dialog overflow ${width} ${action}`);
   if(width===390&&['events','result','fund'].includes(action))await p.screenshot({path:path.join(qa,`mobile-${action}.png`),fullPage:false});
   await p.keyboard.press('Escape');assert.equal(await p.locator('[role=dialog]').count(),0);
  }
 }
 await p.setViewportSize({width:1440,height:1100});
 await p.locator('#compare').click();await p.frameLocator('iframe').locator('.mqx-bg-turn').waitFor();await p.screenshot({path:path.join(qa,'current-and-proposed.png'),fullPage:true});await p.keyboard.press('Escape');
 await p.locator('[data-action="fund"]').first().click();await p.locator('#amount').fill('5000');await p.locator('[data-action="transfer"]').click();assert.equal(await p.locator('[role=dialog]').count(),0);assert.match(await p.locator('.account-strip').innerText(),/30\s000/);
 await p.locator('[data-action="events"]').first().click();await p.locator('[data-action="repair"]').click();assert.match(await p.locator('.action-grid').innerText(),/1 ждут/);
 await p.locator('[data-action="close"]').click();await p.locator('[data-action="confirm-close"]').click();await p.locator('.result-top').waitFor();await p.screenshot({path:path.join(qa,'desktop-result.png'),fullPage:true});assert.match(await p.locator('.result-top').innerText(),/−1\s000/);await p.keyboard.press('Escape');
 await p.locator('[data-action="salary"]').click();assert.match(await p.locator('.action-grid').innerText(),/Зарплата получена/);
 for(const page of ['capital','analytics','menu']){await p.evaluate(id=>document.querySelector(`[data-page="${id}"]`).click(),page);await p.screenshot({path:path.join(qa,`desktop-${page}.png`),fullPage:true});}
 await p.locator('[data-action="finale"]').click();await p.locator('[data-action="show-history"]').click();assert.equal(await p.locator('[role=dialog]').count(),0);assert.match(await p.locator('h1').innerText(),/Видеть дальше/);
 await p.evaluate(()=>document.querySelector('[data-page="home"]').click());await p.setViewportSize({width:390,height:1000});await p.evaluate(()=>document.querySelector('#toast').classList.remove('show'));await p.screenshot({path:path.join(qa,'mobile-home.png'),fullPage:true});
 await p.selectOption('#direction','bridge');await p.setViewportSize({width:1440,height:1100});await p.screenshot({path:path.join(qa,'desktop-bridge.png'),fullPage:true});await p.selectOption('#direction','bold');await p.setViewportSize({width:390,height:1000});
 await p.evaluate(()=>{const b=document.createElement('button');b.dataset.action='settings';document.body.append(b);b.click();b.remove();});await p.locator('#dark-theme').check();await p.keyboard.press('Escape');await p.screenshot({path:path.join(qa,'mobile-dark.png'),fullPage:true});
 assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);
 const report=`PASS: ${states} page/direction/width/state combinations; 63 modal checks; current canon iframe; transfer, event, closing and salary; no horizontal overflow, page errors or HTTP failures.\n`;
 fs.writeFileSync(path.join(qa,'verification.txt'),report);console.log(report);await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
