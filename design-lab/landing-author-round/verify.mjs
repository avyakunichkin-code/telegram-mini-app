import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const require=createRequire(path.join(root,'frontend-react/package.json'));
const {chromium}=require('@playwright/test');
const round=path.join(root,'design-lab/landing-author-round');
const base=process.env.LANDING_REVIEW_URL||'http://127.0.0.1:4188/landing-author-round';
fs.mkdirSync(path.join(round,'qa'),{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const results=[],failures=[];
try{
  const page=await browser.newPage({reducedMotion:'reduce',locale:'ru-RU'});
  page.on('pageerror',error=>failures.push({kind:'js',message:error.message}));
  page.on('response',response=>{if(response.status()>=400)failures.push({kind:'resource',status:response.status(),url:response.url()});});
  for(const variant of ['a','b','c']){
    await page.goto(`${base}/${variant}.html`);
    await page.evaluate(()=>{document.querySelectorAll('img[loading=lazy]').forEach(image=>image.loading='eager');});
    await page.evaluate(()=>Promise.all([...document.images].map(image=>image.decode().catch(()=>null))));
    await page.evaluate(()=>document.fonts.ready);
    for(const width of [320,390,1440]){
      await page.setViewportSize({width,height:900});
      const layout=await page.evaluate(()=>({width:innerWidth,overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth,images:[...document.images].every(image=>image.naturalWidth>0),main:document.querySelectorAll('main').length,h1:document.querySelectorAll('h1').length}));
      results.push({variant,...layout});
      if(layout.overflow||!layout.images||layout.main!==1||layout.h1!==1)failures.push({variant,layout});
      if(width!==320){
        await page.screenshot({path:path.join(round,`qa/${variant}-${width}-hero.png`)});
        await page.screenshot({path:path.join(round,`qa/${variant}-${width}-full.png`),fullPage:true});
      }
    }
    if(variant==='a'){
      for(const choice of ['trip','save','meet']){
        await page.locator(`[data-choice=${choice}]`).click();
        const result=await page.locator('#result').innerText();
        if(!result.includes(choice==='trip'?'12 000':choice==='save'?'12 000':'3 000'))failures.push({variant,choice,result});
        await page.locator('#reset').click();
        if(!await page.locator('[data-choice=trip]').evaluate(node=>node===document.activeElement))failures.push({variant,choice,focus:false});
      }
      const detail=page.locator('details').first();
      const before=await detail.evaluate(node=>node.open);
      await detail.locator('summary').focus();await page.keyboard.press('Enter');
      const after=await detail.evaluate(node=>node.open);
      const cta=await page.locator('.hero .play').getAttribute('href');
      const native=page.frames().some(frame=>frame.url().endsWith('/TurnCard.html'));
      const checks={variant,faqToggled:before!==after,cta,native};results.push(checks);
      if(before===after||!native||cta!=='https://avyakunichkin-code.github.io/telegram-mini-app/#/')failures.push(checks);
      continue;
    }
    await page.locator('[data-choice=home]').click();
    const home=await page.locator('#demo-cash').innerText();
    await page.locator('[data-choice=delivery]').click();
    const delivery=await page.locator('#demo-cash').innerText();
    await page.locator('.reset').click();
    const reset=await page.locator('#demo-cash').innerText();
    await page.locator('.faq details').first().locator('summary').click();
    const open=await page.locator('.faq details').first().evaluate(node=>node.open);
    const cta=await page.locator('.hero .play').getAttribute('href');
    const preview=page.frames().find(frame=>frame.url().endsWith('/preview.html'));
    const native=Boolean(preview&&await preview.locator('.mqx-pocket-help').count());
    const checks={variant,home,delivery,reset,faq:open,cta,native};results.push(checks);
    if(home!=='76 880 ₽'||delivery!=='75 100 ₽'||reset!=='77 500 ₽'||!open||cta!=='http://127.0.0.1:5186/#/'||!native)failures.push(checks);
  }
  await page.goto(`${base}/index.html`);
  const links=await page.locator('.direction').count();
  if(links!==3)failures.push({comparisonLinks:links});
}finally{await browser.close();}
fs.writeFileSync(path.join(round,'qa/verification.json'),JSON.stringify({results,failures},null,2)+'\n');
console.log(JSON.stringify({checks:results.length,failures},null,2));
process.exitCode=failures.length?1:0;
