const main=document.querySelector('#dashboard');
function draw(){
 const state=document.querySelector('#state').value,paid=state==='paid',risk=state==='risk',events=state==='events';
 if(['loading','error','empty'].includes(state)){
  main.innerHTML=state==='loading'?'<div class="lab-state" role="status">Загружаем игру…<div class="lab-skeleton"></div><div class="lab-skeleton"></div></div>':'<div class="lab-state"><h2>'+(state==='error'?'Не удалось загрузить игру':'Начни свою историю')+'</h2><button class="mqx-bg-btn mqx-bg-cta" data-action="retry">'+(state==='error'?'Повторить':'Выбрать жизнь')+'</button></div>';return;
 }
 main.innerHTML=window.DASHBOARD_REFERENCE;
 const salary=main.querySelector('.mqx-bg-salary');salary.dataset.action='salary';
 if(paid){salary.disabled=true;salary.classList.remove('mqx-bg-salary--hot');salary.classList.add('mqx-bg-salary--quiet');salary.querySelector('.mqx-bg-salary__label').textContent='Зарплата получена ✓';salary.querySelector('.mqx-bg-salary__sum')?.remove();}
 main.querySelector('.mqx-bg-money__cash-value').textContent=(paid?'149 900':risk?'29 000':'87 400')+' ₽';
 main.querySelector('.mqx-bg-money__cash').setAttribute('aria-label','На счёте '+(paid?'149 900':risk?'29 000':'87 400')+' рублей');
 const forecast=main.querySelector('.mqx-bg-close-preview');forecast.innerHTML='Спишется <b>37 500 ₽</b> · <span'+(risk?' class="mqx-bg-close-preview__risk"':'')+'>останется <b>'+(paid?'112 400':risk?'−8 500':'49 900')+' ₽</b></span>';forecast.setAttribute('aria-label',forecast.textContent);
 main.querySelector('.mqx-bg-tip__text').textContent=paid?'Зарплата получена — можно планировать расходы':risk?'Не хватит на расходы — забери зарплату':'Забери зарплату до конца хода';
 const close=main.querySelector('.mqx-bg-cta');close.dataset.action='close';close.disabled=events;
 const plate=main.querySelector('.mqx-bg-events');plate.dataset.action='events';plate.disabled=!events;plate.classList.toggle('mqx-bg-events--done',!events);plate.querySelector('.mqx-bg-events__title').textContent=events?'2 события':'События решены';plate.querySelector('.mqx-bg-events__hint').textContent=events?'ждут решения в этом ходу':'новые придут в следующем ходу';
 main.insertAdjacentHTML('beforeend','<p class="canonical-status" role="status">Условные данные. Действия относятся только к примеру.</p>');
}
document.querySelector('#theme').addEventListener('change',e=>document.documentElement.dataset.theme=e.target.value);
document.querySelector('#state').addEventListener('change',draw);
main.addEventListener('click',e=>{const b=e.target.closest('button');if(!b||b.disabled)return;if(b.dataset.action==='salary'){document.querySelector('#state').value='paid';draw();return;}if(b.dataset.action==='retry'){document.querySelector('#state').value='ready';draw();return;}main.querySelector('.canonical-status').textContent='Пример действия. Реальная партия не меняется.';});draw();
