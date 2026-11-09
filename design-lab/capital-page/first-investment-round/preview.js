const root=document.querySelector('#preview');
const money=n=>new Intl.NumberFormat('ru-RU',{maximumFractionDigits:0}).format(n)+' ₽';
const s={variant:'a',state:'empty',product:null,amount:0,cash:80000,bought:null,busy:false};
let lastProduct=null;
let returnProduct='deposit';
const meta={deposit:{title:'Вклад',action:'Открыть вклад',rate:14,explain:'Проценты увеличат сумму вклада при завершении хода. На счёт они не поступают.'},bond:{title:'Облигации',action:'Купить облигации',rate:16,explain:'Купон поступит на счёт при завершении хода. Сумма покупки останется в облигациях.'}};
function render(){
 document.querySelector('#variant-note').textContent=s.variant==='a'?'A · Выбран владельцем. Два прямых действия → окно снизу. Компактная форма: сумма, остаток на счёте и действие.':'B · Архив сравнения. Владелец выбрал A с привычным окном снизу.';
 root.innerHTML=`<div class="top"><strong>ТВОЙ ХОД</strong><span class="tag">Ход 2 · Студент</span></div><h2>Капитал</h2><div class="flows"><div class="row"><span>Доходы за ход</span><strong>62 500 ₽</strong></div><div class="row"><span>Расходы за ход</span><strong>37 500 ₽</strong></div></div><div class="row"><span>На счёте</span><strong>${money(s.cash)}</strong></div><div class="tabs" role="tablist"><button role="tab" aria-selected="true" data-do="details">Детали</button><button role="tab" aria-selected="false" data-do="actions" ${['loading','locked'].includes(s.state)?'disabled':''}>Действия</button></div>${portfolio()}<div class="lot locked"><h3>Имущество</h3><p class="mini">Откроется по цели</p></div><nav class="bottom" aria-label="Пример навигации"><span>Главная</span><strong>Капитал</strong><span>Меню</span></nav>${s.product?sheet():''}`;
 bind();
 if(s.product)for(const child of root.children)if(!child.classList.contains('sheet-layer'))child.inert=true;
 document.body.classList.toggle('sheet-open',Boolean(s.product));
 if(s.product&&lastProduct!==s.product)root.querySelector('.sheet h2')?.focus({preventScroll:true});
 if(!s.product&&lastProduct)root.querySelector(`[data-do="${returnProduct}"]`)?.focus({preventScroll:true});
 lastProduct=s.product;
 if(s.busy)root.querySelectorAll('button').forEach(el=>el.disabled=true);
}
function portfolio(){
 if(s.state==='loading')return '<section class="lot" aria-busy="true"><h3>Вложения</h3><div class="skeleton"></div><p class="mini">Загружаем позиции…</p></section>';
 if(s.state==='locked')return '<section class="lot locked"><h3>Вложения</h3><p>Сначала выполни цель «Подушка». После этого здесь можно открыть вклад или купить облигации.</p><button class="secondary" disabled>Откроется по цели</button></section>';
 if(s.bought){const p=meta[s.bought.product];return `<section class="lot"><p class="success" role="status">${s.bought.product==='deposit'?'Вклад открыт':'Облигации куплены'}</p><h3>${p.title}</h3><div class="row"><span>Сумма позиции</span><strong>${money(s.bought.amount)}</strong></div><p>${p.rate}% в год · ≈ ${money(s.bought.amount*p.rate/1200)} за ход</p><p class="mini">${p.explain}</p><button class="link" data-do="reset">Начать пример заново</button></section>`;}
 return `<section class="lot"><h3>Вложения</h3><p>Пока нет вкладов и облигаций.</p><p class="muted">Деньги можно вложить, оставив на счёте запас на расходы.</p>${s.variant==='a'?'<div class="actions two"><button class="primary" data-do="deposit">Открыть вклад</button><button class="secondary" data-do="bond">Купить облигации</button></div>':'<button class="primary submit" data-do="choose">Выбрать вложение</button>'}</section>`;
}
function sheet(){
 const layer=content=>`<div class="sheet-layer${s.product!==lastProduct?' is-entering':''}"><button class="scrim" data-do="close" tabindex="-1" aria-label="Закрыть окно" ${s.busy?'disabled':''}></button>${content}</div>`;
 if(s.product==='choose')return layer(`<section class="sheet" role="dialog" aria-modal="true" aria-label="Выбрать вложение"><div class="sheet-main"><div class="head"><h2 tabindex="-1">Куда направить деньги?</h2><button class="close" data-do="close" aria-label="Закрыть">×</button></div>${Object.entries(meta).map(([key,p])=>`<button class="choice" data-do="${key}"><strong>${p.title} · ${p.rate}% в год</strong><span>${p.explain}</span></button>`).join('')}<p class="mini">Условные игровые ставки. Доход начисляется при завершении хода.</p></div></section>`);
 const p=meta[s.product]; const amount=s.amount;const left=s.cash-amount;const invalid=amount<=0||amount>s.cash;
 return layer(`<section class="sheet sheet--${s.product}" role="dialog" aria-modal="true" aria-labelledby="product-title" aria-busy="${s.busy}"><div class="handle" aria-hidden="true"></div><div class="sheet-head"><div><h2 id="product-title" tabindex="-1">${p.title}</h2><p class="compact-rate">${p.rate}% в год · игровые условия</p></div><button class="close" data-do="close" aria-label="Закрыть" ${s.busy?'disabled':''}>×</button></div><div class="sheet-main"><label class="field" for="amount">Сколько ${s.product==='deposit'?'отложим':'вложим'}?</label><div class="amount-stage"><input id="amount" aria-describedby="cash-hint" inputmode="numeric" type="text" value="${amount?money(amount).replace(' ₽',''):''}" placeholder="0" ${s.busy?'disabled':''}><span aria-hidden="true">₽</span></div><p class="mini" id="cash-hint">На счёте ${money(s.cash)}</p><div class="presets">${[1000,5000,10000].map(n=>`<button data-amount="${n}" ${s.busy||n>s.cash?'disabled':''}>${money(n)}</button>`).join('')}</div><div class="after-cash row"><span>Останется на счёте</span><strong>${invalid?'—':money(left)}</strong></div>${amount>s.cash?'<p class="error" role="alert">На счёте не хватает денег на эту сумму.</p>':left<37500?'<p class="warn" role="note">На счёте останется меньше расходов за ход. Подушка не оплачивает их автоматически.</p>':''}${s.state==='error'?'<p class="error" role="alert">Не удалось выполнить операцию. Сумма сохранена — попробуй ещё раз.</p>':''}</div><div class="sheet-footer"><button class="primary submit" data-do="submit" ${invalid||s.busy?'disabled':''}>${s.busy?'Выполняем…':p.action}${!invalid&&!s.busy?' · '+money(amount):''}</button><p class="mini">${s.busy?'Подожди немного.':'Сумма спишется со счёта сразу. Игровые условия.'}</p></div></section>`);
}
function reset(){Object.assign(s,{product:null,amount:0,cash:s.state==='zero'?0:80000,bought:null,busy:false});}
function bind(){
 root.querySelectorAll('[data-do]').forEach(el=>el.onclick=async()=>{const a=el.dataset.do;
  if(a==='reset'){s.state='empty';document.querySelector('#state').value='empty';reset();}
  else if(a==='close'||a==='details')s.product=null;
  else if(a==='submit'){if(s.busy||s.amount<=0||s.amount>s.cash)return;s.busy=true;render();await new Promise(r=>setTimeout(r,350));s.busy=false;if(s.state==='error'){s.state='empty';}else{s.bought={product:s.product,amount:s.amount};s.cash-=s.amount;s.product=null;}}
  else{s.product=a==='actions'?'choose':a;s.amount=0;if(a==='deposit'||a==='bond')returnProduct=a;}render();
 });
 root.querySelectorAll('[data-amount]').forEach(el=>el.onclick=()=>{s.amount=Number(el.dataset.amount);render();});
 root.querySelector('#amount')?.addEventListener('input',e=>{const pos=e.target.selectionStart;s.amount=Number(e.target.value.replace(/[^0-9]/g,''))||0;render();const input=root.querySelector('#amount');input.focus({preventScroll:true});input.setSelectionRange(pos,pos);});
}
document.querySelector('#variant').onchange=e=>{s.variant=e.target.value;reset();render();};
document.querySelector('#theme').onchange=e=>document.documentElement.dataset.theme=e.target.value;
document.querySelector('#state').onchange=e=>{s.state=e.target.value;reset();if(['error','busy'].includes(s.state)){s.product='deposit';s.amount=10000;s.busy=s.state==='busy';}if(s.state==='success'){s.bought={product:'deposit',amount:10000};s.cash=70000;}render();};
document.querySelector('#reset').onclick=()=>{s.state='empty';document.querySelector('#state').value='empty';reset();render();};
const params=new URLSearchParams(location.search);
if(['deposit','bond'].includes(params.get('product'))){s.product=params.get('product');returnProduct=s.product;s.amount=Math.min(80000,Math.max(0,Number(params.get('amount'))||0));}
render();

document.addEventListener('keydown',e=>{
 if(!s.product)return;
 if(e.key==='Escape'){e.preventDefault();if(!s.busy){s.product=null;render();}return;}
 if(e.key==='Tab'){
  const dialog=root.querySelector('.sheet');
  const items=[...dialog.querySelectorAll('button:not(:disabled),input:not(:disabled)')];
  const first=items[0],last=items.at(-1);
  if(!first){e.preventDefault();return;}
  if(e.shiftKey&&(document.activeElement===first||!items.includes(document.activeElement))){e.preventDefault();last.focus();}
  else if(!e.shiftKey&&(document.activeElement===last||!items.includes(document.activeElement))){e.preventDefault();first.focus();}
 }
});
