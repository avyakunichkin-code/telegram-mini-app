import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const round=path.dirname(fileURLToPath(import.meta.url)),root=path.resolve(round,'../..');
const source=fs.readFileSync(path.join(round,'source-current-landing.html'),'utf8');
function section(key,byClass=false){
  const condition=byClass?String.raw`(?=[^>]*class="${key}(?: |"))`:String.raw`(?=[^>]*id="${key}")`;
  const pattern=new RegExp(String.raw`<section\b${condition}[^>]*>[\s\S]*?<\/section>`);
  const match=source.match(pattern);if(!match)throw new Error('Missing source section '+key);
  if((match[0].match(/<section\b/g)||[]).length!==1)throw new Error('Unexpected nested section '+key);
  return match[0].replaceAll('class="eyebrow"','class="overline"');
}
const sections={interface:section('interface'),how:section('how'),choice:section('try'),life:section('life',true),roadmap:section('roadmap'),faq:section('faq'),final:section('final',true)};
sections.interface=sections.interface.replace('system-examples wrap','system-examples selected-section wrap').replace('Чернильный край · как в приложении','Твой игровой пульт · как в приложении');
if(process.argv.includes('--lab-only')) sections.interface=sections.interface.replace(/(<iframe[^>]*src="\.\/game-preview\/MoneyTiles.html"[^>]*><\/iframe>)/,'$1'+fs.readFileSync(path.join(round,'money-history.html'),'utf8'));
sections.how=sections.how.replace('class="how wrap"','class="how"').replace('Выбери персонажа и познакомься с его доходами, обязательствами и целью.','Начни за Студента и познакомься с его доходами, обязательствами и целью. Другую жизнь можно выбрать в следующей новой игре.');
if(process.argv.includes('--lab-only')) sections.how=sections.how.replace('class="section-heading"','class="section-heading how-with-mascot"').replace('<div class="section-heading how-with-mascot">','<div class="section-heading how-with-mascot"><img class="how-mascot" src="./assets/student-next-move.png" alt="Студент обдумывает следующий ход с игровой фишкой в руке" width="160" height="200" loading="lazy">');
sections.life=sections.life.replace('class="life wrap"','class="life"').replace(/(<section[^>]*>)/,'$1<div class="life-inner">').replace('</section>','</div></section>');
sections.final=sections.final.replace('class="final wrap"','class="final"').replace(/(<section[^>]*>)/,'$1<div class="wrap">').replace('</section>','</div></section>');
const header=`<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="ТВОЙ ХОД — игра про личные финансы. Принимай решения, проживай игровые месяцы и двигайся к своей цели."><title>ТВОЙ ХОД — Финансы как игра</title><link rel="icon" href="data:,"><link rel="stylesheet" href="./author-base.css"><link rel="stylesheet" href="./author-a.css"><link rel="stylesheet" href="./selected-a.css"><script src="./main.js" defer></script></head><body data-direction="a"><a class="skip-link" href="#main">К содержанию</a><header class="masthead"><a href="#top" aria-label="ТВОЙ ХОД — на начало"><img class="logo" src="./assets/logo-full.webp" alt="ТВОЙ ХОД — Финансы как игра" width="91" height="66"></a><nav aria-label="Основная навигация"><a href="#interface">Интерфейс</a><a href="#how">Как играть</a><a href="#try">Твой первый выбор</a><a href="#roadmap">Развитие</a></nav><a class="play small" href="https://avyakunichkin-code.github.io/telegram-mini-app/#/">Открыть игру <b aria-hidden="true">↗</b></a></header><main id="main"><section class="hero" id="top"><img class="hero-art" src="./assets/first-move.png" alt="Авторская игровая дорожка — метафора финансовой истории" fetchpriority="high" width="1536" height="1024"><div class="hero-shade"></div><div class="hero-content"><p class="overline">ИГРА ПРО ДЕНЬГИ И ЖИЗНЬ</p><h1>Деньги.<br>Решения.<br><em>Твой ход.</em></h1><p class="hero-intro">Зарплата пришла. Планы уже есть. А жизнь снова подкидывает выбор. Проживи свою финансовую историю — и посмотри, к чему приведут решения.</p><div class="hero-actions"><a class="play" href="https://avyakunichkin-code.github.io/telegram-mini-app/#/"><span>Попробовать игру</span><b aria-hidden="true">↗</b></a><a class="quiet-link" href="#try">Сначала сделать выбор ↓</a></div><p class="hero-fine">Ранняя версия · В браузере · В своём темпе</p></div><span class="scene-caption">ОДИН МЕСЯЦ. МНОГО ВОЗМОЖНОСТЕЙ.</span><a class="scroll-cue" href="#interface" aria-label="Посмотреть интерфейс">↓</a></section><div class="selected-ribbon"><span>Решения вместо лекций</span><b aria-hidden="true">✦</b><span>Ошибки без реальных потерь</span><b aria-hidden="true">✦</b><span>Твой темп, твоя история</span></div>`;
const footer=`</main><footer class="wrap"><img class="logo" src="./assets/logo-full.webp" alt="ТВОЙ ХОД — Финансы как игра" width="91" height="66"><div class="footer-copy"><b>ТВОЙ ХОД</b><span>Игра про решения и их последствия.</span></div><a href="mailto:hello@tvoyhod.app">Обратная связь и партнёрство ↗</a><p>Игровая симуляция. Не финансовая рекомендация.</p></footer></body></html>`;
let html=header+Object.values(sections).join('\n')+footer;
html=html.replace(/class="button gold"/g,'class="play"').replace(/class="button"/g,'class="play"');
// The lab keeps exact production content; only local navigation/assets are adjusted.
const lab=html.replace('href="./author-base.css"','href="./lab-base.css"').replace('href="./author-a.css"','href="./styles.css"').replace('src="./main.js"','src="./current-content.js"');
fs.writeFileSync(path.join(round,'a.html'),lab);
if(process.argv.includes('--lab-only')){console.log('Updated selected A lab only; landing/site unchanged.');process.exit(0);}
const site=path.join(root,'landing/site');
fs.writeFileSync(path.join(site,'index.html'),html);
for(const [from,to] of [['lab-base.css','author-base.css'],['styles.css','author-a.css'],['selected-a.css','selected-a.css']])fs.copyFileSync(path.join(round,from),path.join(site,to));
fs.copyFileSync(path.join(round,'assets/first-move.png'),path.join(site,'assets/first-move.png'));
fs.cpSync(path.join(round,'assets/fonts'),path.join(site,'assets/fonts'),{recursive:true});
for(const name of ['student-introduce.webp','professional-explain.webp','manager-choice.webp','entrepreneur-roadmap.webp','kvitya-soft-volume.webp'])fs.copyFileSync(path.join(site,'assets',name),path.join(round,'assets',name));
fs.cpSync(path.join(site,'ds'),path.join(round,'ds'),{recursive:true});
console.log('Applied approved A style with existing landing content; lab and landing/site updated.');

