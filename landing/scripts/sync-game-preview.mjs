import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';

// Export approved native markup rather than maintaining a second UI drawing.
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const source=path.join(root,'design-lab/dashboard/pocket-page-round');
const target=path.join(root,'landing/site/game-preview');
fs.mkdirSync(target,{recursive:true});
const context={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(source,'reference.js'),'utf8'),context,{timeout:1000});
const markup=context.window.POCKET_REFERENCE.ready;
function fragment(className){
  const start=new RegExp('<(\\w+)[^>]*class="[^\"]*\\b'+className+'\\b[^\"]*"[^>]*>').exec(markup);
  if(!start)throw new Error('Missing canonical block '+className);
  const tags=new RegExp('</?'+start[1]+'\\b[^>]*>','g');
  tags.lastIndex=start.index;let depth=0,tag;
  while((tag=tags.exec(markup))){
    depth+=tag[0].startsWith('</')?-1:1;
    if(depth===0)return markup.slice(start.index,tags.lastIndex)
      .replace(/<button\b([^>]*)>/g,'<div $1>').replace(/<\/button>/g,'</div>')
      .replace(/\s(?:tabindex|disabled|aria-disabled|aria-pressed)="[^"]*"/g,'');
  }
  throw new Error('Unclosed canonical block '+className);
}
fs.copyFileSync(path.join(source,'runtime.css'),path.join(target,'runtime.css'));
fs.cpSync(path.join(source,'assets'),path.join(target,'assets'),{recursive:true});
for(const [name,block,title] of [['TurnCard','mqx-pocket-hero','Твой ход'],['MoneyTiles','mqx-bg-money','Деньги на виду']]){
  const content=fragment(block)+(name==='TurnCard'?fragment('mqx-pocket-tickets'):'');
  fs.writeFileSync(path.join(target,name+'.html'),`<!doctype html><html lang="ru" data-theme="light" data-mqx-style="ink"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title} · текущий канон</title><link rel="icon" href="data:,"><link rel="stylesheet" href="./runtime.css"><style>*,*::before,*::after{box-sizing:border-box}html,body,#root{height:auto;min-height:0;max-height:none;background:transparent}body{margin:0}#root{display:block;padding:8px 12px 12px;overflow:visible;width:100%;max-width:390px;margin:auto}.mqx-pocket-main{display:grid;gap:12px}.mqx-pocket-help-dialog{display:none}html{overflow-x:hidden}html[data-theme],html[data-theme] body,#root,.mqx-pocket,.mqx-pocket-main{background:transparent!important;box-shadow:none!important;outline:none!important;border:0!important}body#root{padding:0;width:100%;max-width:none;margin:0}.mqx-pocket{min-height:0!important}.mqx-pocket-main{padding:0!important;min-height:0!important}</style></head><body id="root"><div class="mqx-pocket"><div class="mqx-pocket-main">${content}</div></div></body></html>\n`);
}
fs.writeFileSync(path.join(target,'provenance.json'),JSON.stringify({source:'design-lab/dashboard/pocket-page-round/reference.js',sha256:createHash('sha256').update(fs.readFileSync(path.join(source,'reference.js'))).digest('hex'),state:'ready',style:'Pocket Board G / Monetka B',note:'Static native fragments, sample data; buttons are passive spans.'},null,2)+'\n');
console.log('Synced landing previews from approved dashboard canon');
