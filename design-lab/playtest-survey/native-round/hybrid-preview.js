import {SURVEY_QUESTIONS,SURVEY_STEPS} from './three-step-layout.js';
const questions=SURVEY_QUESTIONS.map(q=>[q.key,q.title,q.options.map(([,label])=>label)]);
const groups=SURVEY_STEPS.map(step=>step.questions.map(q=>SURVEY_QUESTIONS.indexOf(q)));
const titles=SURVEY_STEPS.map(step=>step.title);
const LAST_STEP=groups.length-1;
const s={answers:{},comment:'',step:0,state:'form'};
const root=document.querySelector('#variant-h');
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ready=()=>groups[s.step].every(i=>questions[i][0] in s.answers);
function render(focus=false){
 root.innerHTML='<div class="screen-top">ТВОЙ ХОД <small>Студент · 5 ходов закрыто</small></div>';
 if(s.state==='invite')root.innerHTML+='<div class="center"><img src="./assets/monetka.webp" alt=""><h3>Как тебе первые ходы?</h3><p>Девять вопросов и свободный отзыв на трёх шагах.</p><p class="muted">Добровольно · пара минут · без награды</p><button class="primary" data-action="open">Ответить</button><button class="plain" data-action="later">Позже</button></div>';
 else if(s.state==='success')root.innerHTML+='<div class="center"><img src="./assets/monetka.webp" alt=""><h3 class="thanks" tabindex="-1">Спасибо за ответы!</h3><p>Они помогут сделать игру понятнее.</p><button class="primary" data-action="later">Вернуться в игру</button></div>';
 else if(s.state==='later')root.innerHTML+='<div class="center"><h3>Продолжаем игру</h3><p>Опрос останется в меню. Автоматического приглашения больше не будет.</p><button class="secondary" data-action="open">Поделиться впечатлением</button></div>';
 else if(s.state==='empty')root.innerHTML+='<div class="center"><h3>Сначала попробуй игру</h3><p>После начала партии здесь можно оставить отзыв.</p><button class="primary" disabled>Ответить</button></div>';
 else {
  const busy=s.state==='sending';
  root.innerHTML+=`<form class="sheet"><header class="sheet-head"><button class="close" type="button" aria-label="Закрыть опрос" data-action="later" ${busy?'disabled':''}>×</button><p class="step-line">Шаг ${s.step+1} из ${groups.length}</p><h3 tabindex="-1">${titles[s.step]}</h3></header><div class="content">${s.state==='error'?'<p class="error" role="alert">Не удалось отправить. Ответы на месте — попробуй ещё раз.</p>':''}${groups[s.step].map(i=>{const [key,title,labels]=questions[i];return `<fieldset class="question"><legend>${title}</legend><div class="options ${key==='difficulty'?'difficulty-options':''}">${labels.map((label,n)=>`<label class="option"><input type="radio" name="h-${key}" data-key="${key}" value="${n}" ${s.answers[key]===n?'checked':''}>${label}</label>`).join('')}</div></fieldset>`;}).join('')}${s.step===LAST_STEP?`<label class="text-label" for="h-comment">Расскажи своими словами <span class="muted">Необязательно</span></label><textarea id="h-comment" maxlength="1000" placeholder="Что понравилось, чего не хватило или где застрял?">${escape(s.comment)}</textarea><p class="muted">До 1000 символов. Не указывай личные данные. Ответ увидит команда игры.</p>`:''}</div><footer class="footer"><div class="hybrid-footer-actions">${s.step>0?`<button class="secondary" type="button" data-action="back" ${busy?'disabled':''}>Назад</button>`:''}<button class="primary" type="submit" ${busy||!ready()?'disabled':''}>${busy?'Отправляем…':s.step<LAST_STEP?'Дальше':'Отправить ответы'}</button></div><p class="muted">${busy?'Подожди немного.':'Добровольно. Можно закрыть в любой момент.'}</p></footer></form>`;
  if(busy)root.querySelectorAll('input,textarea').forEach(el=>el.disabled=true);
 }
 root.querySelectorAll('[data-action]').forEach(el=>el.onclick=()=>{const action=el.dataset.action;if(action==='open')s.state='form';else if(action==='back')s.step--;else{s.state='later';s.answers={};s.step=0;s.comment='';}document.querySelector('#step').value=String(s.step);render(true);});
 root.querySelectorAll('input').forEach(el=>el.onchange=()=>{s.answers[el.dataset.key]=Number(el.value);root.querySelector('[type=submit]').disabled=!ready();});
 root.querySelector('textarea')?.addEventListener('input',e=>s.comment=e.target.value);
 root.querySelector('form')?.addEventListener('submit',e=>{e.preventDefault();if(s.step<LAST_STEP)s.step++;else s.state='success';document.querySelector('#step').value=String(s.step);render(true);});
 if(focus)root.querySelector('h3')?.focus({preventScroll:true});
}
document.querySelector('#theme').onchange=e=>document.documentElement.dataset.theme=e.target.value;
document.querySelector('#state').onchange=e=>{s.state=e.target.value;if(['error','sending'].includes(s.state))s.step=LAST_STEP;document.querySelector('#step').value=String(s.step);render();};
document.querySelector('#step').onchange=e=>{s.step=Number(e.target.value);s.state='form';document.querySelector('#state').value='form';render();};
document.querySelector('#reset').onclick=()=>{s.answers={};s.comment='';s.step=0;s.state='form';document.querySelector('#step').value='0';document.querySelector('#state').value='form';render();};
document.querySelector('#menu-open').onclick=()=>{s.state='form';render(true);root.scrollIntoView({block:'center'});};
render();
