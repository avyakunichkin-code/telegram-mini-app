import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const round=path.dirname(fileURLToPath(import.meta.url));
// Presentation-only overrides. Canonical game markup and production exports stay intact.
for(const name of ['TurnCard','MoneyTiles']){
 const file=path.join(round,'game-preview',name+'.html');
 let html=fs.readFileSync(file,'utf8').replace(/<style id="landing-native">[\s\S]*?<\/style>/g,'');
 html=html.replace('</head>','<style id="landing-native">html[data-theme],html[data-theme] body,#root,.mqx-pocket,.mqx-pocket-main{background:transparent!important;box-shadow:none!important;outline:none!important;border:0!important}body#root{padding:0;width:100%;max-width:none;margin:0}.mqx-pocket{min-height:0!important}.mqx-pocket-main{padding:0!important;min-height:0!important}</style></head>');
 fs.writeFileSync(file,html);
}
console.log('Lab native fragments: transparent backgrounds, intrinsic height, no outer padding.');
