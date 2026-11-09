const {chromium}=require('../../../frontend-react/node_modules/@playwright/test');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const base='http://127.0.0.1:4188/screen-refresh/pocket-board-round/';
const retained={
 'index.html':'4FD41109ED1C8F7F02A47FD5D24FD8CC6C0A63E4C377536CE0B039155B1920AD',
 'app.js':'78D5F5B20F712D8A40473534E6D4995626F6228E7370B2A50DCD8007F6A90F4B',
 'styles.css':'7BF963BF6BDAC15EC78DCC539981A11CA363BEC1024AFB893CD13A7DD32BFC52'
};
function verifyRetained(){for(const [name,hash] of Object.entries(retained))assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(__dirname,'../complete-game-round',name))).digest('hex').toUpperCase(),hash,`Previous prototype changed: ${name}`);}
(async()=>{
 verifyRetained();
 const browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-proxy-server']});
 const p=await browser.newPage({viewport:{width:1440,height:1050},reducedMotion:'reduce'}),qa=path.join(__dirname,'qa');fs.mkdirSync(qa,{recursive:true});
 const select=(selector,value)=>p.selectOption(selector,value,{force:true});
 const errors=[],failed=[];p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400)failed.push(r.url()+':'+r.status());});
 await p.goto(base);await p.evaluate(()=>document.fonts.ready);await p.locator('.pocket-persona').evaluate(i=>i.decode());
 await p.screenshot({path:path.join(qa,'desktop-console.png'),fullPage:true});
 let checks=0;
 for(const width of [1440,768,390,320]){await p.setViewportSize({width,height:844});for(const theme of ['console','passport']){await select('#pocket',theme);for(const page of ['home','capital','analytics','menu']){await p.evaluate(id=>document.querySelector(`[data-page="${id}"]`).click(),page);for(const state of ['normal','risk','loading','empty','error','disabled']){await select('#condition',state);assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`overflow: ${width} ${theme} ${page} ${state}`);checks++;}}}}
 await p.goto(base+'?phone=1');
 for(const [width,height] of [[320,640],[360,640],[390,844],[430,932]]){await p.setViewportSize({width,height});for(const theme of ['console','passport']){await select('#pocket',theme);for(const state of ['normal','risk']){await select('#condition',state);const geometry=await p.evaluate(()=>({bottom:document.querySelector('.player-vitals').getBoundingClientRect().bottom,nav:document.querySelector('.mobile-nav').getBoundingClientRect().top,actions:[...document.querySelectorAll('.command-board button,.turn-tickets button,.vital')].map(el=>({label:el.getAttribute('aria-label')||el.innerText,bottom:el.getBoundingClientRect().bottom,height:el.getBoundingClientRect().height}))}));assert.ok(geometry.bottom<=geometry.nav,`Priority group hidden ${width}x${height} ${theme} ${state}: ${JSON.stringify(geometry)}`);for(const a of geometry.actions)assert.ok(a.height>=32,`tiny control ${a.label}`);}}}
 await p.setViewportSize({width:390,height:844});await select('#condition','normal');await select('#pocket','console');await p.screenshot({path:path.join(qa,'mobile-console.png'),fullPage:false});await select('#pocket','passport');await p.screenshot({path:path.join(qa,'mobile-passport.png'),fullPage:false});
 await select('#pocket','console');
 const hint=p.locator('.salary-reminder');assert.equal(await hint.count(),1);assert.equal(await p.locator('.field-note').count(),0);
 const box=await p.locator('.salary-reminder-close').boundingBox();assert.equal(box.width,44);assert.equal(box.height,44);
 assert.ok(await hint.evaluate(el=>el.previousElementSibling.classList.contains('command-board')&&el.nextElementSibling.classList.contains('turn-tickets')));
 await p.locator('.salary-reminder-close').click({position:{x:40,y:40}});assert.equal(await hint.count(),0);
 await p.evaluate(()=>document.querySelector('[data-page="capital"]').click());await p.evaluate(()=>document.querySelector('[data-page="home"]').click());assert.equal(await hint.count(),0);
 await p.locator('[data-action="salary"]').click();assert.match(await p.locator('.pocket-cash').innerText(),/92\s000/);await p.locator('[data-action="salary"]').click();assert.match(await p.locator('.pocket-cash').innerText(),/92\s000/);
 await p.locator('[data-action="fund"]').first().click();await p.locator('#amount').fill('5000');await p.locator('[data-action="transfer"]').click();assert.match(await p.locator('.pocket-cash').innerText(),/87\s000/);
 await p.locator('[data-action="events"]').click();await p.screenshot({path:path.join(qa,'mobile-event.png'),fullPage:false});await p.locator('[data-action="repair"]').click();assert.match(await p.locator('.pocket-cash').innerText(),/79\s000/);
 await p.locator('[data-action="close"]').click();await p.locator('[data-action="confirm-close"]').click();assert.match(await p.locator('.result-top').innerText(),/49\s000/);await p.keyboard.press('Escape');assert.equal(await p.locator('.salary-reminder').count(),1);
 for(const action of ['needs','goal','withdraw','invest','achievements','settings','about','flows','expenses','newgame','finale']){await p.evaluate(action=>{const b=document.createElement('button');b.dataset.action=action;document.body.append(b);b.click();b.remove();},action);await p.locator('[role=dialog]').waitFor();assert.equal(await p.locator('.modal').evaluate(el=>el.scrollWidth>el.clientWidth),false,action+' modal overflow');await p.keyboard.press('Escape');}
 await p.goto(base);await p.setViewportSize({width:1440,height:1050});await p.locator('#phone-button').click();await p.frameLocator('.phone-frame iframe').locator('.player-vitals').waitFor();await p.screenshot({path:path.join(qa,'desktop-phone-preview.png'),fullPage:true});await p.keyboard.press('Escape');
 await p.goto(base+'mobile.html');await p.setViewportSize({width:1000,height:1130});await p.frameLocator('iframe').first().locator('.player-vitals').waitFor();await p.frameLocator('iframe').nth(1).locator('.player-vitals').waitFor();await p.screenshot({path:path.join(qa,'mobile-comparison.png'),fullPage:true});
 assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);verifyRetained();
 const report=`PASS: ${checks} layout/state checks; 16 priority-group viewport checks (320x640 through 430x932); 44x44 close target and edge click, hint placement/dismiss/navigation/new turn; salary once, transfer, event, closing; 11 additional dialogs; mobile iframe and side-by-side comparison; no page errors/HTTP failures; previous prototype SHA256 unchanged.\n`;
 fs.writeFileSync(path.join(qa,'verification.txt'),report);console.log(report);await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
