import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const dir=path.dirname(fileURLToPath(import.meta.url));
const chart=fs.readFileSync(path.join(dir,'money-history.html'),'utf8');
for(const name of ['a.html','a-road-tiles.html','a-before-roadmap.html']){
 const file=path.join(dir,name);let html=fs.readFileSync(file,'utf8');
 html=html.replace(/<figure class="money-history"[\s\S]*?<\/figure>/g,'');
 html=html.replace(/(<iframe[^>]*src="\.\/game-preview\/MoneyTiles.html"[^>]*><\/iframe>)/,'$1'+chart);
 fs.writeFileSync(file,html);
}
console.log('Added illustrative money history to lab only.');
