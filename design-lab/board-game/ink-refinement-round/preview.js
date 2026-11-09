const main=document.querySelector('#variants');
const variants=[['current','Сейчас · текущая игра','Эталон: HTML актуальных React-компонентов и собранный CSS приложения. Условные данные.'],['a','A · Ясный итог','Тот же дашборд. Только прогноз остатка заметнее и расположен перед завершением хода.'],['b','B · Следующий шаг','Тот же дашборд. В карте явно обозначена последовательность: события → закрытие.'],['c','C · Видимая цель','Тот же дашборд. У цели видны число выполненных условий и прогресс.']];
function namespace(root,prefix){
 const ids=[...root.querySelectorAll('[id]')].map(el=>el.id);
 for(const el of root.querySelectorAll('*'))for(const attr of [...el.attributes]){
  let value=attr.value;
  for(const id of ids){
   if(attr.name==='id'&&value===id)value=prefix+'-'+id;
   else if(['aria-labelledby','aria-describedby','aria-controls'].includes(attr.name))value=value.split(' ').map(x=>x===id?prefix+'-'+id:x).join(' ');
   else value=value.split('url(#'+id+')').join('url(#'+prefix+'-'+id+')').split('href="#'+id+'"').join('href="#'+prefix+'-'+id+'"');
  }
  if(value!==attr.value)el.setAttribute(attr.name,value);
 }
}
function draw(){
 const state=document.querySelector('#state').value,risk=state==='risk',events=state==='events';
 main.replaceChildren();
 for(const [v,title,note] of variants){
  const article=document.createElement('article');article.className='lab-column';article.dataset.variant=v;
  article.innerHTML='<div class="caption"><h2>'+title+'</h2><p>'+note+'</p></div><div class="lab-phone"></div>';
  const phone=article.querySelector('.lab-phone');
  if(['loading','error','empty'].includes(state)){
   phone.innerHTML=state==='loading'?'<div class="lab-state" role="status">Загружаем игру…<div class="lab-skeleton"></div><div class="lab-skeleton"></div></div>':'<div class="lab-state"><h3>'+(state==='error'?'Не удалось загрузить игру':'Начни свою историю')+'</h3><button class="mqx-bg-btn mqx-bg-cta" data-action="'+(state==='error'?'retry':'new')+'">'+(state==='error'?'Повторить':'Выбрать жизнь')+'</button></div>';
  }else{
   phone.innerHTML=window.DASHBOARD_REFERENCE;
   namespace(phone,v);
   const close=phone.querySelector('.mqx-bg-cta');close.dataset.action='close';close.disabled=events;
   const plate=phone.querySelector('.mqx-bg-events');plate.dataset.action='events';plate.disabled=!events;
   plate.querySelector('.mqx-bg-events__title').textContent=events?'2 события':'События решены';
   plate.querySelector('.mqx-bg-events__hint').textContent=events?'ждут решения в этом ходу':'новые придут в следующем ходу';
   plate.classList.toggle('mqx-bg-events--done',!events);
   if(risk){
    phone.querySelector('.mqx-bg-money__cash-value').textContent='29 000 ₽';
    phone.querySelector('.mqx-bg-money__cash').setAttribute('aria-label','На счёте 29 000 руб.');
    const forecast=phone.querySelector('.mqx-bg-close-preview');
    forecast.innerHTML='Спишется <b>37 500 ₽</b> · <span class="mqx-bg-close-preview__risk">останется <b>−8 500 ₽</b></span>';
    forecast.setAttribute('aria-label','Спишется 37 500 рублей, останется минус 8 500 рублей');
    phone.querySelector('.mqx-bg-tip__text').textContent='Не хватит на расходы — забери зарплату';
   }
   if(v==='a'){
    const forecast=phone.querySelector('.mqx-bg-close-preview');forecast.remove();
    const box=document.createElement('div');box.className='lab-forecast';box.dataset.risk=String(risk);
    box.innerHTML='<span>После списания<br>37 500 ₽ останется</span><strong>'+(risk?'−8 500':'49 900')+' ₽</strong>';
    close.before(box);
   }
   if(v==='b'){
    const step=document.createElement('p');step.className='lab-step';step.textContent=events?'1. Разбери события → 2. Заверши ход':'✓ События разобраны → заверши ход';
    phone.querySelector('.mqx-bg-events').before(step);
   }
   if(v==='c'){
    const detail=document.createElement('div');detail.className='lab-goal-progress';
    detail.innerHTML='<p>Выполнено 2 из 3 условий цели</p><div class="mqx-progress" role="progressbar" aria-label="Условия цели" aria-valuemin="0" aria-valuemax="3" aria-valuenow="2"><div class="mqx-progress__fill" style="width:66.667%"></div></div>';
    phone.querySelector('.mqx-bg-goal').append(detail);
   }
   phone.querySelector('.mqx-bg-goal__toggle').dataset.action='goal';
  }
  const status=document.createElement('p');status.className='lab-status';status.setAttribute('role','status');phone.append(status);
  main.append(article);
 }
}
document.querySelector('#theme').addEventListener('change',e=>document.documentElement.dataset.theme=e.target.value);
document.querySelector('#state').addEventListener('change',draw);
main.addEventListener('click',e=>{
 const button=e.target.closest('button');if(!button||button.disabled)return;
 const phone=button.closest('.lab-phone'),action=button.dataset.action;
 if(action==='retry'){document.querySelector('#state').value='ready';draw();return;}
 const messages={close:'Пример: здесь откроется следующий ход.',events:'Пример: здесь откроется колода событий.',new:'Пример: здесь откроется выбор жизни.',goal:'В текущем компоненте здесь раскрываются условия цели.'};
 phone.querySelector('.lab-status').textContent=messages[action]||'Пример действия из текущей игры. Реальная партия не меняется.';
});
draw();
