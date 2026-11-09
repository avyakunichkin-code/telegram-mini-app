import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
export async function exportDashboardReference(round) {
if(!['design-lab/board-game/ink-refinement-round','design-lab/dashboard/current-page-round'].includes(round))throw new Error('Unsupported dashboard lab target');
const dir=path.join(repo,round);
const frontend=path.join(repo,'frontend-react');
const require=createRequire(path.join(frontend,'package.json'));
const {chromium}=require('@playwright/test');
const assets=path.join(dir,'assets/runtime');await fs.mkdir(assets,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
let html;
try {
 const page=await browser.newPage({viewport:{width:390,height:1000}});
 await page.addInitScript(()=>localStorage.setItem('tg_miniapp_token','synthetic-lab-reference'));
 await page.route(url=>url.pathname.startsWith('/api/'),route=>route.fulfill({json:route.request().url().includes('/user/me')?{id:1,username:'Демо'}:[]}));
 await page.goto('http://127.0.0.1:5176/?style=ink#/dev/mqx');
 const frame=page.locator('[data-catalog-demo=dashboard] .mqx-tab-page');
 await frame.waitFor();await frame.locator('img').evaluateAll(async nodes=>Promise.all(nodes.map(n=>n.decode())));
 html=await frame.evaluate(el=>{const clone=el.cloneNode(true);clone.classList.remove('mqx-catalog__board-demo');return clone.outerHTML});
} finally {await browser.close()}
for(const match of [...html.matchAll(/(?:src|srcset)="([^"]+)"/g)]) {
 const url=match[1];if(url.startsWith('data:'))continue;
 const pathname=decodeURIComponent(new URL(url,'http://127.0.0.1:5176').pathname);
 if(!pathname.startsWith('/src/assets/'))throw new Error(`Unexpected reference asset: ${url}`);
 const source=path.resolve(frontend,'.'+pathname);
 const name=path.basename(source);await fs.copyFile(source,path.join(assets,name));
 html=html.split(url).join('./assets/runtime/'+name);
}
const dist=path.join(frontend,'dist/assets');
const cssName=(await fs.readdir(dist)).find(name=>/^index-.*\.css$/.test(name));
if(!cssName)throw new Error('Run frontend build before refreshing the lab reference');
let css=await fs.readFile(path.join(dist,cssName),'utf8');
for(const match of [...css.matchAll(/url\(([^)]+)\)/g)]) {
 const url=match[1].replace(/^['"]|['"]$/g,'');if(/^(data:|#|https?:)/.test(url))continue;
 const name=path.basename(url.split('?')[0]);await fs.copyFile(path.join(dist,name),path.join(assets,name));
 css=css.split(match[0]).join(`url('./assets/runtime/${name}')`);
}
await fs.writeFile(path.join(dir,'runtime.css'),'/* Generated production CSS snapshot; refresh with render-reference.mjs. */\n'+css);
await fs.writeFile(path.join(dir,'reference.js'),'window.DASHBOARD_REFERENCE = '+JSON.stringify(html)+';\n');
await fs.writeFile(path.join(dir,'reference-provenance.json'),JSON.stringify({date:'2026-11-04',source:'CurrentDashboardDemo → production MQX dashboard components',fixtures:'synthetic, no backend writes',css:cssName,sha256:createHash('sha256').update(css).digest('hex'),refresh:'build frontend, then node '+round+'/render-reference.mjs'},null,2)+'\n');
console.log('Captured native dashboard markup, production CSS and local assets.');

}
