const root=document.querySelector('#result');
const money=n=>new Intl.NumberFormat('ru-RU',{maximumFractionDigits:0}).format(n)+' ₽';
const s={variant:'a',scenario:'normal'};
function data(){
 const common={period:2,balance:50133,delta:25133,charges:37500,coupon:133,interest:117,overdue:0,forecast:50133,beforeClose:87500,expectedCharges:37500};
 if(s.scenario==='simple')return {...common,balance:50000,delta:25000,coupon:0,interest:0,forecast:50000};
 if(s.scenario==='negative')return {...common,balance:-6500,delta:-16500,beforeClose:31000,coupon:0,interest:0,forecast:-6500};
 if(s.scenario==='overdue')return {...common,balance:-6500,delta:-16500,beforeClose:31000,coupon:0,interest:0,forecast:-6500,overdue:2400};
 if(s.scenario==='mismatch')return {...common,forecast:51133,expectedCharges:36500};
 if(s.scenario==='historical')return {...common,forecast:null,beforeClose:null,expectedCharges:null};
 return common;
}
function render(){
 const d=data();root.hidden=false;
 document.querySelector('#explanation').textContent=s.variant==='a'?'A · Рекомендую: итог счёта и три ключевые операции. Использует существующий ответ сервера; нет дублирующей истории про те же деньги.':'B · Явно сравнивает последний сохранённый прогноз с фактом. Нужен снимок перед закрытием; для старого итога без снимка сравнение не придумывается.';
 const compare=s.variant==='b'?(d.forecast===null?`<div class="balance"><span>На счёте сейчас</span><strong>${money(d.balance)}</strong></div><p class="muted snapshot-missing">Прогноз для этого итога не сохранён.</p>`:`<div class="compare"><div><span>Ожидалось на счёте</span><strong>${money(d.forecast)}</strong></div><div><span>Получилось</span><strong>${money(d.balance)}</strong></div></div><p class="comparison-status ${d.forecast===d.balance?'':'risk'}">${d.forecast===d.balance?'✓ Остаток совпал с прогнозом':'Прогноз отличается от итога на '+money(Math.abs(d.forecast-d.balance))}</p>`):'';
 const rows=[{label:'Расходы списаны',value:'−'+money(d.charges),note:null},...(d.coupon?[{label:'Купоны на счёт',value:'+'+money(d.coupon)}]:[]),...(d.interest?[{label:'Проценты во вклад',value:'+'+money(d.interest),note:'Увеличили вклад, не счёт'}]:[])];
 root.innerHTML=`<div class="result-scroll"><div class="heading"><span class="done-mark" aria-hidden="true">✓</span><span>Ход ${d.period} завершён</span></div><h2 id="title" tabindex="-1">${s.variant==='b'?'Сверим результат':'Всё посчитано'}</h2>${s.variant==='a'?`<div class="balance"><span>На счёте сейчас</span><strong class="${d.balance<0?'risk':''}">${money(d.balance)}</strong></div>`:''}${compare}<p class="whole-turn">За весь ход: <strong>${d.delta>=0?'+':''}${money(d.delta)}</strong></p>${d.balance<0?'<p class="notice risk" role="note">Счёт ушёл в минус. Проверь расходы перед следующим закрытием.</p>':''}${d.overdue?`<p class="notice risk" role="note">Просрочка +${money(d.overdue)} — часть платежей осталась неоплаченной.</p>`:''}<ul class="operations">${rows.map(r=>`<li><span>${r.label}${r.note?`<small>${r.note}</small>`:''}</span><strong>${r.value}</strong></li>`).join('')}</ul>${s.scenario==='events'?'<p class="notice" role="status">Карточки этого хода не собрались. Можно играть дальше — напиши нам, если повторится.</p>':''}<details><summary>Подробнее о ходе</summary><p>Изменение счёта за весь ход включает зарплату, события и твои операции. Оно не равно списанию при закрытии.</p><p>${d.interest?'Проценты по вкладу остаются во вкладе. Купон облигаций поступает на счёт.':'На счёт не было начислений от вложений.'}</p>${s.variant==='b'&&d.beforeClose!==null?`<p>Перед закрытием на счёте: ${money(d.beforeClose)}. Прогноз списаний: ${money(d.expectedCharges)}. Фактически списано: ${money(d.charges)}.</p>`:''}</details></div><footer class="result-footer"><button class="primary" id="next" type="button">Дальше</button></footer>`;
 root.querySelector('#next').onclick=()=>{root.hidden=true;document.querySelector('#reopen').focus({preventScroll:true});};
}
document.querySelector('#variant').onchange=e=>{s.variant=e.target.value;render();};
document.querySelector('#scenario').onchange=e=>{s.scenario=e.target.value;render();};
document.querySelector('#theme').onchange=e=>document.documentElement.dataset.theme=e.target.value;
document.querySelector('#reopen').onclick=()=>{render();root.querySelector('#title').focus({preventScroll:true});};
render();
