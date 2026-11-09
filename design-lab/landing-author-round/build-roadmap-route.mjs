import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const round=path.dirname(fileURLToPath(import.meta.url));
let html=fs.readFileSync(path.join(round,'a.html'),'utf8');
// Preserve the last reviewed page for a repeatable section-only comparison.
const backup=path.join(round,'a-before-roadmap.html');
if(!fs.existsSync(backup))fs.writeFileSync(backup,html);
else html=fs.readFileSync(backup,'utf8');
const section=html.match(/<section class="roadmap wrap"[\s\S]*?<\/section>/)?.[0];
if(!section)throw Error('Roadmap source missing');
let content=section.replace('roadmap wrap','roadmap wrap roadmap-route');
content=content.replace(/<div class="narrator">[\s\S]*?<\/div><\/div>/,'');
content=content.replace('<ol class="roadmap-track">','<div class="route-board"><svg class="route-road" viewBox="0 0 260 1000" preserveAspectRatio="none" aria-hidden="true"><path class="road-base" d="M55 80 C55 180 205 180 205 310"/><path class="road-next" d="M205 310 C205 430 55 430 55 560 S205 690 205 810 L205 940"/><path class="road-edge" d="M55 80 C55 180 205 180 205 310 S55 430 55 560 S205 690 205 810 L205 940"/></svg><ol class="roadmap-track">').replace('</ol>','</ol></div>');
let n=0;content=content.replace(/(<li class="milestone[^"]*">)/g,match=>{n++;return match+`<span class="route-node" aria-hidden="true">${n===1?'✓':String(n).padStart(2,'0')}</span>`+(n===2?'<img class="route-player" src="./assets/entrepreneur-roadmap.webp" alt="Предприниматель на текущем этапе разработки" width="110" height="138" loading="lazy"><span class="route-here">Мы здесь</span>':'');});
const options='<nav class="route-options" aria-label="Варианты дорожки"><a href="./a.html#roadmap" CURRENT_A>А · Плавная дорожка</a><a href="./a-road-tiles.html#roadmap" CURRENT_B>Б · Игровые плитки</a></nav>';
content=content.replaceAll('<div class="milestone-top">','<div class="milestone-copy"><div class="milestone-top">').replaceAll('</li>','</div></li>');
content=content.replace('<div class="route-board">',options+'<div class="route-board">');
content=content.replace('<ol class="roadmap-track">','<svg class="route-diagonal" viewBox="0 0 1000 900" preserveAspectRatio="none" aria-hidden="true"><path class="road-base" d="M80 620 C170 620 250 500 340 500"/><path class="road-next" d="M340 500 C440 500 540 380 640 380 S820 260 920 260"/><path class="road-edge" d="M80 620 C170 620 250 500 340 500 S540 380 640 380 S820 260 920 260"/></svg><ol class="roadmap-track">');
for(const [name,tiles] of [['a.html',false],['a-road-tiles.html',true]]){
 let variant=content.replace('CURRENT_A',tiles?'':'aria-current="page"').replace('CURRENT_B',tiles?'aria-current="page"':'');
 if(tiles)variant=variant.replace('roadmap-route','roadmap-route route-tiles');
 const output=html.replace(section,variant).replace('</head>','<link rel="stylesheet" href="./roadmap-route.css"></head>');
 fs.writeFileSync(path.join(round,name),output);
}
console.log('Two roadmap route variants built in lab; production unchanged.');
