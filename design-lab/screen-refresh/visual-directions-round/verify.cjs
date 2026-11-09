const { chromium }=require('../../../frontend-react/node_modules/@playwright/test');
const path=require('node:path');
const fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 const page=await browser.newPage({viewport:{width:1440,height:1100}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 let html=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');
 for(const name of ['lab-base.css','styles.css'])html=html.replace(`<link rel="stylesheet" href="./${name}">`,`<style>${fs.readFileSync(path.join(__dirname,name),'utf8')}</style>`);
 html=html.replace('<script type="module" src="./preview.js"></script>','');
 await page.setContent(html);
 await page.addScriptTag({content:fs.readFileSync(path.join(__dirname,'preview.js'),'utf8')});
 await page.evaluate(()=>document.fonts.ready);
 await page.screenshot({path:path.join(__dirname,'comparison.png'),fullPage:true});
 let count=0;
 for(const width of [1440,390,320]){
  await page.setViewportSize({width,height:1000});
  for(const screen of ['home','event','capital','analytics','result'])for(const state of ['normal','risk','loading','empty','error','disabled']){
   await page.selectOption('#screen',screen);await page.selectOption('#state',state);
   if(await page.locator('.phone').count()!==3)throw Error('Missing variants');
   if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error(`Overflow ${width} ${screen} ${state}`);
   count++;
  }
 }
 await page.selectOption('#screen','home');await page.selectOption('#state','normal');
 await page.locator('.b [data-demo="Закрыть месяц"]').click();
 if(!(await page.locator('.b .feedback').innerText()).includes('Данные не изменены'))throw Error('Missing feedback');
 await page.locator('.b [data-screen="capital"]').click();
 if(await page.locator('#screen').inputValue()!=='capital')throw Error('Navigation failed');
 if(errors.length)throw Error(errors.join('\n'));
 console.log(`PASS: ${count} combinations; 3 widths, 5 screens, 6 states; feedback + navigation; no page errors.`);
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
