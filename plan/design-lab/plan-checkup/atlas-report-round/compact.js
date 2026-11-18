// B2 refinement: one question, one working area; original calculation fixture preserved.
document.body.classList.add('compact-app')
document.querySelector('.header .navigation').remove()
document.querySelector('.intro').innerHTML=`<div class="question-heading"><p class="eyebrow">Семейный чекап · ноябрь 2026</p><h1 id="title">Как у нас дела в целом?</h1><p class="question-meta">По введённым диапазонам · демо-семья</p></div><div class="answer-band"><span class="answer-symbol" aria-hidden="true">!</span><div><b>Бюджет в плюсе. Запас стоит укрепить.</b><p>Остаётся 45 000 ₽ в месяц, но при потере крупнейшего дохода дефицит возникнет с 4-го месяца.</p></div></div>`
const overview=document.createElement('section')
overview.id='answer'
overview.className='answer-panel report-chapter'
overview.innerHTML=`<div class="answer-metrics"><article><span>Остаётся в месяц</span><strong>45 000 ₽</strong><small>180 000 ₽ доход − 135 000 ₽ расходов</small></article><article><span>Резерв семьи</span><strong>2 <small>из 3 месяцев</small></strong><small>270 000 ₽ · до цели ещё 135 000 ₽</small><div class="mini-route" aria-hidden="true"><i></i><i></i><i></i></div></article></div><div class="answer-next"><span class="eyebrow">Ваш следующий шаг</span><h2>Начните с дорогого долга</h2><p>Проверьте условия досрочного погашения кредитной карты. В этом примере дополнительные 11 250 ₽ в месяц сокращают срок всех долгов на 5 месяцев.</p></div>`
const steps=document.querySelector('.steps-section')
steps.querySelector('.section-heading').remove()
steps.querySelector('.step').open=false
overview.append(steps)
const details=document.createElement('details')
details.className='overview-details'
details.innerHTML='<summary>Все четыре области и капитал семьи</summary>'
details.append(document.querySelector('.details-section'))
overview.append(details)
document.querySelector('.composition').remove()
const deep=document.querySelector('.deep-report')
deep.querySelector('.chapter-heading').remove()
deep.querySelector('.chapter-nav').remove()
const container=deep.querySelector('#deep-sections')
container.prepend(overview)
const tabs=document.createElement('div')
tabs.className='workspace-tabs'
tabs.setAttribute('role','tablist')
tabs.setAttribute('aria-label','Разделы ответа')
const items=[['answer','Ответ','01'],['forecast','Прогноз','02'],['stress','Стресс-тест','03'],['debts','Долги','04'],['history','История','05']]
tabs.innerHTML=items.map(([id,title,n])=>`<button type="button" role="tab" id="tab-${id}" aria-controls="${id}" aria-selected="false" tabindex="-1" data-panel="${id}"><span class="tab-number" aria-hidden="true">${n}</span><span>${title}</span><span class="tab-arrow" aria-hidden="true">↗</span></button>`).join('')
deep.prepend(tabs)
const panels=items.map(([id])=>document.getElementById(id))
panels.forEach(panel=>{panel.setAttribute('role','tabpanel');panel.setAttribute('aria-labelledby',`tab-${panel.id}`);panel.tabIndex=0})
function showPanel(id,focus=false){
 if(!items.some(item=>item[0]===id))id='answer'
 panels.forEach(panel=>panel.hidden=panel.id!==id)
 tabs.querySelectorAll('button').forEach(button=>{const selected=button.dataset.panel===id;button.setAttribute('aria-selected',String(selected));button.tabIndex=selected?0:-1;if(selected&&focus)button.focus()})
}
tabs.addEventListener('click',event=>{
 const button=event.target.closest('[data-panel]');if(!button)return
 showPanel(button.dataset.panel)
 history.replaceState(null,'',`#${button.dataset.panel}`)
})
tabs.addEventListener('keydown',event=>{
 const current=items.findIndex(item=>`tab-${item[0]}`===document.activeElement.id)
 if(current<0)return
 let index
 if(event.key==='ArrowRight')index=(current+1)%items.length
 else if(event.key==='ArrowLeft')index=(current-1+items.length)%items.length
 else if(event.key==='Home')index=0
 else if(event.key==='End')index=items.length-1
 else return
 event.preventDefault();showPanel(items[index][0],true)
 history.replaceState(null,'',`#${items[index][0]}`)
})
function followHash(){showPanel(location.hash.slice(1))}
window.addEventListener('hashchange',followHash)
showPanel(location.hash.slice(1))
document.querySelector('.lab-note').textContent='B2 / C1 · утверждено 07.11.2026'
document.querySelector('.footer').innerHTML='<p class="small-note">Демо-данные. Расчёт по введённым значениям, не обещание результата. Условные ставки. Отметки сохраняются только в этом макете.</p>'
// Keep the optional remaining steps collapsed; the first actionable step stays visible.
const stepList=document.querySelector('#live-steps')
const remaining=[...stepList.querySelectorAll('.step')].slice(1)
const more=document.createElement('details')
more.className='more-steps'
more.innerHTML='<summary>Ещё 2 шага плана</summary>'
remaining.forEach(step=>more.append(step))
stepList.insertBefore(more,document.querySelector('#action-error'))
const answerSummary=overview.querySelector('.answer-next')
answerSummary.querySelector('h2').remove()
answerSummary.querySelector('p').textContent='Проверьте условия досрочного погашения.'

// Expressive wayfinding: a desktop route rail becomes a thumb-friendly mobile dock.
const icons={answer:'<path d="m5 12 4 4 10-10"/>',forecast:'<path d="M4 18h16M5 14l5-5 4 3 5-7"/>',stress:'<path d="M12 3 4 6v6c0 4 8 9 8 9s8-5 8-9V6zM12 8v5m0 3v.1"/>',debts:'<path d="M5 5h14v14H5zM8 9h8m-8 4h5"/>',history:'<path d="M4 8a8 8 0 1 1-1 7M4 3v5h5m3 0v5l3 2"/>'}
tabs.querySelectorAll('[data-panel]').forEach(button=>{
 const id=button.dataset.panel
 const icon=document.createElement('span');icon.className='nav-glyph';icon.setAttribute('aria-hidden','true')
 icon.innerHTML=`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${icons[id]}</svg>`
 button.prepend(icon)
 button.querySelector('.tab-number').remove()
 button.querySelector('.tab-arrow').remove()
 if(id==='stress')button.querySelector('span:not(.nav-glyph)').textContent='Устойчивость'
})
document.querySelector('.answer-band b').textContent='Есть остаток. Не хватает запаса.'
document.querySelector('.answer-band p').textContent='Без основного дохода — дефицит с 4-го месяца.'
document.querySelector('.question-meta').remove()
const metricCards=overview.querySelectorAll('.answer-metrics article')
metricCards[0].querySelector('small').textContent='После расходов и платежей'
metricCards[1].querySelector(':scope>small').textContent='Цель — 3 месяца расходов'
const firstTitle=stepList.querySelector('.step summary b')
firstTitle.textContent='Разобраться с кредитной картой'
stepList.querySelector('.step-caption').textContent='Открыть действия'
details.querySelector('summary').textContent='Вся картина семьи'
document.querySelector('.footer .small-note').textContent='Демо · условные ставки · расчёт не гарантирует результат.'

function softenNumbers(){
 // Exact supporting values remain available; the first layer shows the conclusion.
 document.querySelectorAll('.history-records').forEach(el=>{
  if(el.parentElement.classList.contains('archive-details'))return
  const fold=document.createElement('details');fold.className='archive-details';fold.innerHTML='<summary>Сохранённые разборы</summary>';el.before(fold);fold.append(el)
 })
 document.querySelectorAll('.history-comparison article').forEach((el,i)=>{if(i===0||i===2||i===3)return;el.classList.add('secondary-metric')})
 const result=document.querySelector('#stress-result')
 const p=result.querySelector('.stress-verdict p')
 if(p&&!result.querySelector('.stress-explanation')){
  const fold=document.createElement('details');fold.className='stress-explanation';fold.innerHTML='<summary>Почему такой вывод</summary>';p.before(fold);fold.append(p)
 }
}
softenNumbers()
new MutationObserver(softenNumbers).observe(document.querySelector('#history-content'),{childList:true})
new MutationObserver(softenNumbers).observe(document.querySelector('#stress-result'),{childList:true})
// Keep navigation within reach and restore the panel start after switching on a long screen.
tabs.addEventListener('click',()=>{if(matchMedia('(max-width:700px)').matches)document.querySelector('.intro').scrollIntoView({block:'start',behavior:'instant'})})
