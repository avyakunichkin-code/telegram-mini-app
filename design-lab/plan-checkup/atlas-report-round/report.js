const fixture = window.ATLAS_FIXTURE
const r = fixture.current
const money = value => new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(value) + ' ₽'
const number = value => new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 1 }).format(value)
const month = value => new Intl.DateTimeFormat('ru-RU', { month: 'short', year: 'numeric' }).format(new Date(value + '-01T12:00:00'))
const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))
const valueLabel = (v,unit) => unit===' ₽'?money(v):number(v)+unit
const delta = (a,b,unit=' ₽') => (b === a ? 'Без изменений' : (b > a ? '+' : '−') + valueLabel(Math.abs(b-a),unit))
const state = document.querySelector('#state')
const announce = text => { document.querySelector('#announcement').textContent = text }
const verdict = {ok:'Выдерживает 12 месяцев', edge:'Есть дефицит', fail:'Есть дефицит'}
let activeScenario = 0
let activeChapter = 'forecast'
let beforeIndex = 1
let savingTimer = null
let pending = null
const marks = new Set()
const dismissed = new Set()

function graph(series, domain=null) {
  const narrow = matchMedia('(max-width:700px)').matches
  const width = narrow ? 360 : 860
  const end = width - 30
  const values = series.flatMap(s=>s.points.map(p=>p.liquid))
  const min = domain?.[0] ?? Math.min(0,...values)
  const max = domain?.[1] ?? Math.max(1,...values)
  const x = i => 75 + i * ((end - 75) / 11)
  const y = v => 235 - (v-min)/(max-min)*205
  const ticks = [min,(min+max)/2,max]
  return `<svg class="financial-chart" viewBox="0 0 ${width} 285" role="img" aria-label="${esc(series.map(s=>s.name).join(' и '))}. Значения по месяцам доступны в таблице ниже.">${ticks.map(t=>`<line class="grid-line" x1="75" x2="${end}" y1="${y(t)}" y2="${y(t)}"/><text x="65" y="${y(t)+4}" text-anchor="end">${number(t/1000)} тыс.</text>`).join('')}<line class="zero-line" x1="75" x2="${end}" y1="${y(0)}" y2="${y(0)}"/>${series.map((s,i)=>`<polyline class="chart-track track-${i}" points="${s.points.map((p,i)=>`${x(i)},${y(p.liquid)}`).join(' ')}"/><circle class="track-end track-${i}" cx="${end}" cy="${y(s.points.at(-1).liquid)}" r="5"/>`).join('')}${(narrow?[0,11]:[0,3,6,11]).map(i=>`<text x="${x(i)}" y="270" text-anchor="${i===0?'start':i===11?'end':'middle'}">${esc(month(series[0].points[i].month))}</text>`).join('')}</svg>`
}

function dataTable(series) {
  return `<details class="chart-data"><summary>Значения по месяцам</summary><div class="table-scroll" tabindex="0" role="region" aria-label="Таблица значений прогноза"><table><caption>Остаток на конец месяца, рубли</caption><thead><tr><th scope="col">Месяц</th>${series.map(s=>`<th scope="col">${esc(s.name)}</th>`).join('')}</tr></thead><tbody>${series[0].points.map((p,i)=>`<tr><th scope="row">${esc(month(p.month))}</th>${series.map(s=>`<td>${money(s.points[i].liquid)}</td>`).join('')}</tr>`).join('')}</tbody></table></div></details>`
}

const forecastSeries = [{name:'Базовый',points:r.forecast.base},{name:'Пессимистичный',points:r.forecast.pessimistic}]
document.querySelector('#forecast-content').innerHTML = `<div class="forecast-grid"><div class="forecast-summary"><p class="eyebrow">На конец ${esc(month(r.forecast.base.at(-1).month))}</p><span class="legend-label"><i></i>Базовый сценарий</span><strong>${money(r.forecast.base.at(-1).liquid)}</strong><span class="legend-label pess"><i></i>Пессимистичный</span><strong>${money(r.forecast.pessimistic.at(-1).liquid)}</strong><p>Сейчас на счёте <b>270 000 ₽</b>.<br>График начинается с конца первого месяца.</p></div><div class="chart-panel">${graph(forecastSeries)}${dataTable(forecastSeries)}</div></div><details class="method"><summary>На чём основан прогноз</summary><p>Базовый: доход 180 000 ₽, расходы на жизнь 105 000 ₽ и обязательные платежи 30 000 ₽ в месяц. Пессимистичный: доход 170 000 ₽, расходы на жизнь 110 000 ₽, те же платежи. В прогнозе учитывается закрытие долгов по текущему графику.</p><p>Это сценарий «ничего не менять»: без дополнительного погашения, новых взносов на цели и будущей инфляции. Сравнение стратегий ниже — отдельный расчёт, его экономия не добавлена к этому графику. Доходность не задана; ставки кредитов условные.</p></details>`

const stressDomain = [Math.min(0,...r.scenarios.flatMap(s=>s.series.map(p=>p.liquid))), Math.max(...r.scenarios.flatMap(s=>s.series.map(p=>p.liquid)))]
function renderStress() {
  document.querySelector('#stress-options').innerHTML = r.scenarios.map((s,i)=>`<button type="button" class="scenario-choice" data-scenario="${i}" aria-pressed="${i===activeScenario}"><span class="scenario-index">0${i+1}</span><span><b>${esc(s.title)}</b><small>${esc(s.description)}</small></span><span class="scenario-symbol" aria-hidden="true">${s.verdict==='ok'?'↗':'!'}</span></button>`).join('')
  const s = r.scenarios[activeScenario]
  const series = [{name:s.title, points:s.series}]
  document.querySelector('#stress-result').innerHTML = `<p class="scenario-assumption">${esc(s.description)}</p><div class="stress-verdict ${s.verdict==='ok'?'positive':'negative'}"><span>${verdict[s.verdict]}</span><strong>${s.months_until_negative ? `Дефицит с ${s.months_until_negative}-го месяца` : 'Деньги остаются'}</strong><p>Минимальный остаток: <b>${money(s.min_liquid)}</b>. ${s.months_until_negative?'Отрицательное значение означает нехватку денег, даже если к концу года остаток снова положительный.':'Ни в одном месяце рассчитанный остаток не уходит ниже нуля.'}</p></div>${graph(series,stressDomain)}<p class="chart-note">Одинаковый масштаб для всех четырёх сценариев. Линия нуля обозначает границу дефицита.</p>${dataTable(series)}`
}
renderStress()
document.querySelector('#stress-options').addEventListener('click',e=>{
  const b=e.target.closest('[data-scenario]');if(!b)return
  activeScenario=Number(b.dataset.scenario);renderStress()
  document.querySelector(`[data-scenario="${activeScenario}"]`).focus()
})

const d = r.debt_strategy
document.querySelector('#debt-content').innerHTML = `<div class="debt-topline"><div><span class="eyebrow">Всего долга</span><strong>300 000 ₽</strong></div><p>Обязательные платежи — <b>30 000 ₽/мес.</b><br>${number(r.metrics_base.dti_percent)} % от базового дохода · просрочек нет</p><span class="signal neutral">Два обязательства</span></div><div class="budget-split"><p><b>Остаток 45 000 ₽ распределён один раз</b><span>22 500 ₽ → резерв</span><span>11 250 ₽ → сверх платежей по долгам</span><span>11 250 ₽ → не распределено</span></p><div aria-hidden="true"><i></i><i></i><i></i></div></div><div class="debt-strategies">${[['current','Как сейчас','Только обязательные платежи'],['avalanche','Лавина','Сначала самый дорогой долг'],['snowball','Снежный ком','Сначала самый маленький долг']].map(([key,title,caption])=>`<article class="strategy ${key==='avalanche'?'accent':''}"><p class="eyebrow">${key==='current'?'Текущий график':'+ '+money(d.extra)+'/мес.'}</p><h3>${title}</h3><p>${caption}</p><strong>${d[key].months} <small>месяцев</small></strong><dl><div><dt>Закрытие по модели</dt><dd>${esc(month(d[key].payoff_month))}</dd></div><div><dt>Проценты за весь срок</dt><dd>${money(d[key].total_interest)}</dd></div></dl><details><summary>Порядок погашения</summary><ol>${d[key].order.map(title=>`<li>${esc(title)}</li>`).join('')}</ol></details></article>`).join('')}</div><p class="debt-conclusion">Лавина и снежный ком в этом примере дают одинаковый результат: <b>на ${d.current.months-d.avalanche.months} месяцев раньше</b> и примерно <b>на ${money(d.saved_by_avalanche)} меньше процентов</b>.</p><details class="method"><summary>Условия сравнения</summary><p>Кредитная карта: 60 000 ₽ под условные 24 %, платёж 10 000 ₽. Потребительский кредит: 240 000 ₽ под условные 12 %, платёж 20 000 ₽. Это вымышленные договоры, не предложения банков. Расчётные проценты округлены для отображения до рубля.</p><p>В стратегиях освобождённые платежи направляются на следующий долг. Условия банка, комиссии и фактическую дату закрытия нужно сверить самостоятельно. Новые платежи и денежные переводы здесь не выполняются.</p></details>`

const areaLabels = {green:'В порядке',yellow:'Есть вопросы',red:'Нужен разбор'}
document.querySelector('#area-summary').innerHTML = `<p class="eyebrow">03 / Четыре области</p><div class="area-strip">${r.areas.map(a=>`<article><span class="signal ${a.light==='green'?'neutral':'warning'}">${areaLabels[a.light]}</span><h3>${esc(a.title)}</h3><p>${a.key==='budget'?'25 % дохода остаётся':a.key==='debts'?'16,7 % дохода на платежи':a.key==='cushion'?'2 из 3 месяцев запаса':'Явных флагов по правилам нет'}</p>${a.key==='protection'?'<small>Это результат правил для введённых данных, а не подтверждение достаточной защиты.</small>':''}</article>`).join('')}</div><p class="chart-note">Капитал семьи: <b>${money(r.net_worth)}</b>. Накопления 270 000 ₽ минус долги 300 000 ₽; имущество в примере не задано.</p>`

function renderSteps() {
  document.querySelector('#live-steps').innerHTML=r.steps.map((s,i)=>`<details class="step" ${i===0?'open':''}><summary><span class="step-number">0${i+1}</span><span><b>${esc(s.title)}</b><span class="step-caption">${i===0?'Условия договора — сначала':i===1?'Посмотрите, когда возникает дефицит':'До выбранного запаса — 135 000 ₽'}</span></span><span class="expand" aria-hidden="true">+</span></summary><div class="step-body"><p>${esc(s.why)}</p><div class="checklist">${s.actions.map(a=>`<label><input type="checkbox" data-action="${s.rule_key}/${a.key}" data-step="${s.rule_key}"><span>${esc(a.title)}</span></label>`).join('')}</div><div class="step-progress"><span data-progress="${s.rule_key}">Выполнено 0 из ${s.actions.length}</span><span data-save-status="${s.rule_key}" role="status"></span></div><button class="text-button" type="button" data-dismiss="${s.rule_key}">Не подходит</button></div></details>`).join('')
  document.querySelector('#live-steps').insertAdjacentHTML('beforeend','<div class="inline-error" id="action-error" role="alert" hidden>Не удалось сохранить отметку. Изменение не применено. <button type="button" id="retry-action">Повторить</button></div>')
}
renderSteps()

function updateSteps() {
  const blocked = state.value==='offline'||state.value==='saving'||Boolean(savingTimer)
  document.querySelectorAll('[data-action]').forEach(input=>{input.checked=savingTimer&&pending?.key===input.dataset.action?pending.checked:marks.has(input.dataset.action);input.disabled=blocked||dismissed.has(input.dataset.step)})
  r.steps.forEach(s=>{
    const done=s.actions.filter(a=>marks.has(`${s.rule_key}/${a.key}`)).length
    const complete=done===s.actions.length&&!dismissed.has(s.rule_key)
    const step=document.querySelector(`[data-progress="${s.rule_key}"]`).closest('.step')
    step.classList.toggle('is-complete',complete)
    const summary=step.querySelector('summary')
    let badge=summary.querySelector('.completion-badge')
    if(!badge){badge=document.createElement('span');badge.className='completion-badge';summary.querySelector('b').after(badge)}
    badge.textContent='✓ Выполнено'
    badge.hidden=!complete
    const rank=summary.querySelector('.step-number')
    rank.textContent=complete?'✓':`0${s.rank}`
    document.querySelector(`[data-progress="${s.rule_key}"]`).textContent=dismissed.has(s.rule_key)?'Не подходит':`Выполнено ${done} из ${s.actions.length}${done===s.actions.length?' · шаг завершён':''}`
    const button=document.querySelector(`[data-dismiss="${s.rule_key}"]`)
    button.disabled=blocked;button.textContent=dismissed.has(s.rule_key)?'Вернуть в план':'Не подходит'
  })
  document.querySelector('#retry-action').disabled=blocked
}

function save(action, retry=false) {
  pending=action
  document.querySelector('#action-error').hidden=true
  document.querySelector(`[data-save-status="${action.step}"]`).textContent='Сохраняем…'
  savingTimer=setTimeout(()=>{
    savingTimer=null
    if(state.value==='save-error'&&!retry){document.querySelector('#action-error').hidden=false;document.querySelector(`[data-save-status="${action.step}"]`).textContent='Не сохранено'}
    else{action.checked?marks.add(action.key):marks.delete(action.key);pending=null;document.querySelector(`[data-save-status="${action.step}"]`).textContent='Сохранено в демо'}
    updateSteps()
  },500)
  updateSteps()
}
document.querySelector('#live-steps').addEventListener('change',e=>{const t=e.target;if(t.matches('[data-action]'))save({key:t.dataset.action,step:t.dataset.step,checked:t.checked})})
document.querySelector('#live-steps').addEventListener('click',e=>{
  const button=e.target.closest('[data-dismiss]')
  if(button){const key=button.dataset.dismiss;dismissed.has(key)?dismissed.delete(key):dismissed.add(key);updateSteps();announce(button.textContent==='Не подходит'?'Шаг возвращён в план':'Шаг отмечен как не подходящий')}
  if(e.target.closest('#retry-action')){if(pending)save(pending,true);else{document.querySelector('#action-error').hidden=true;announce('Повторите отметку действия.')}}
})

function renderHistory() {
  const target=document.querySelector('#history-content')
  const hs=document.querySelector('#history-state').value
  if(state.value==='offline'){target.innerHTML='<div class="history-message"><h3>Для истории нужна сеть.</h3><p>Последний сохранённый отчёт выше доступен только для чтения. Другие отчёты и сравнение офлайн недоступны.</p></div>';return}
  const messages={loading:'Загружаем сохранённые отчёты…',empty:'Завершите первый чекап — здесь начнётся ваша история.',single:'Первый разбор уже сохранён. Для сравнения нужен второй итоговый отчёт.',error:'Не удалось загрузить историю. Текущий разбор остаётся доступен.'}
  if(messages[hs]){target.innerHTML=`<div class="history-message" role="status"><h3>${hs==='empty'?'У истории будет начало.':hs==='error'?'Журнал пока недоступен.':hs==='single'?'Первая точка на карте.':'Загружаем историю.'}</h3><p>${messages[hs]}</p>${hs==='error'?'<button class="button primary" type="button" data-history-retry>Повторить загрузку ↗</button>':hs==='single'?'<button class="button primary" type="button" data-open-report="0">Открыть первый отчёт ↗</button>':''}</div>`;return}
  const before=fixture.history[beforeIndex]
  const specs=[['Остаток в месяц',x=>x.free_cashflow,' ₽'],['Всего долга',x=>x.metrics_base.total_debt,' ₽'],['Резерв',x=>x.areas.find(a=>a.key==='cushion').metrics.cushion,' ₽'],['Запас в месяцах',x=>x.metrics_base.safety_fund_months,' мес.'],['Капитал семьи',x=>x.net_worth,' ₽']]
  target.innerHTML=`<div class="history-top"><div class="history-pair"><label>Было<select id="history-before"><option value="1" ${beforeIndex===1?'selected':''}>Октябрь 2026</option><option value="0" ${beforeIndex===0?'selected':''}>Сентябрь 2026</option></select></label><span aria-hidden="true">→</span><div><span>Стало</span><b>Ноябрь 2026</b></div></div><button class="text-button" type="button" data-first>С первым чекапом</button></div>${hs==='versions'?'<p class="version-note">Версии расчёта различаются. Числа сохранены как есть; смена статуса может быть связана с правилами, а не с положением семьи.</p>':''}<div class="history-comparison">${specs.map(([title,fn,unit])=>`<article><h3>${title}</h3><div><span>${valueLabel(fn(before),unit)}</span><span aria-hidden="true">→</span><strong>${valueLabel(fn(r),unit)}</strong></div><p>${delta(fn(before),fn(r),unit)}</p></article>`).join('')}</div><p class="chart-note">Данные ${esc(month(before.as_of))} → ${esc(month(r.as_of))}. Разница не объясняет причины изменений. В примере это отдельные синтетические снимки, не результат выполнения шагов.</p><div class="history-records">${fixture.history.map((item,i)=>`<article><p class="eyebrow">Запись 0${i+1}</p><h3>${esc(month(item.as_of))}</h3><p>Резерв ${money(item.areas.find(a=>a.key==='cushion').metrics.cushion)}</p><button type="button" class="text-button" data-open-report="${i}">Открыть сохранённый разбор ↗</button></article>`).join('')}</div>`
}
document.querySelector('#history-state').addEventListener('change',renderHistory)
document.querySelector('#history-content').addEventListener('change',e=>{if(e.target.id==='history-before'){beforeIndex=Number(e.target.value);renderHistory();document.querySelector('#history-before').focus()}})
document.querySelector('#history-content').addEventListener('click',e=>{
  if(e.target.closest('[data-history-retry]')){document.querySelector('#history-state').value='ready';renderHistory();document.querySelector('#history-before').focus()}
  if(e.target.closest('[data-first]')){beforeIndex=0;renderHistory();document.querySelector('#history-before').focus()}
  const open=e.target.closest('[data-open-report]');if(open)openRecord(Number(open.dataset.openReport))
})
const dialog=document.createElement('dialog');dialog.className='record-dialog';dialog.setAttribute('aria-labelledby','record-title');document.body.append(dialog)
function openRecord(index){
  const item=fixture.history[index]
  dialog.innerHTML=`<form method="dialog"><button class="dialog-close" aria-label="Закрыть сохранённый разбор">×</button></form><p class="eyebrow">Сохранённый итоговый отчёт · только чтение</p><h2 id="record-title">${esc(month(item.as_of))}</h2><p>Демонстрационная сохранённая запись. Расчёт v${esc(item.rules_version)}.</p><dl><div><dt>Остаётся в месяц</dt><dd>${money(item.free_cashflow)}</dd></div><div><dt>Резерв</dt><dd>${money(item.areas.find(a=>a.key==='cushion').metrics.cushion)}</dd></div><div><dt>Всего долга</dt><dd>${money(item.metrics_base.total_debt)}</dd></div></dl><p class="chart-note">В этом lab-предпросмотре показаны ключевые показатели сохранённого отчёта. Текущий чекап и отметки действий не изменяются.</p>`
  dialog.showModal()
}

const chapters=[...document.querySelectorAll('#deep-sections>.report-chapter')]
function chooseChapter(id){
  activeChapter=id
  const chapterMode=document.querySelector('[name=variant]:checked').value==='chapters'
  chapters.forEach(section=>section.hidden=chapterMode&&section.id!==id)
  document.querySelectorAll('.chapter-nav a').forEach(a=>{if(a.hash===`#${id}`)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current')})
}
document.querySelectorAll('[name=variant]').forEach(input=>input.addEventListener('change',()=>{document.body.classList.toggle('chapter-mode',input.value==='chapters');chooseChapter(activeChapter);announce(input.value==='chapters'?'Подробности по разделам':'Единый отчёт')}))
document.querySelectorAll('.navigation a,.chapter-nav a').forEach(a=>a.addEventListener('click',()=>{
  if(chapters.some(section=>`#${section.id}`===a.hash))chooseChapter(a.hash.slice(1))
  document.querySelectorAll('.navigation a').forEach(n=>n.removeAttribute('aria-current'))
  const current=document.querySelector(`.navigation a[href="${a.hash}"]`);current?.setAttribute('aria-current','location')
}))
function handleHash(){if(chapters.some(c=>`#${c.id}`===location.hash))chooseChapter(location.hash.slice(1))}
window.addEventListener('hashchange',handleHash)

const placeholders={loading:'Собираем ваш атлас…',empty:'Сначала — ваша точка.',error:'Не удалось открыть разбор.'}
function setState(){
  clearTimeout(savingTimer);savingTimer=null;pending=null
  const value=state.value
  const placeholder=document.querySelector('#placeholder')
  const replace=Boolean(placeholders[value])
  document.querySelector('#report').hidden=replace
  placeholder.hidden=!replace
  placeholder.innerHTML=replace?`<section class="placeholder" role="${value==='loading'?'status':'region'}"><p class="eyebrow">Семейный финансовый чекап</p><h1>${placeholders[value]}</h1><p>${value==='loading'?'Суммы появятся после расчёта.':value==='empty'?'Для отчёта нужны доходы, расходы и накопления.':'Повторите загрузку. Данные чекапа не нужно вводить заново.'}</p>${value==='loading'?'<div class="skeleton big" aria-hidden="true"></div>':'<button class="button primary" type="button" data-report-retry>'+ (value==='empty'?'Открыть демо-отчёт':'Попробовать ещё раз')+' ↗</button>'}</section>`:''
  document.querySelector('#offline-note').hidden=value!=='offline'
  document.querySelector('#action-error').hidden=value!=='save-error'
  document.querySelector('#history-state').disabled=value==='offline'
  document.querySelectorAll('[data-save-status]').forEach(el=>el.textContent=value==='saving'?'Сохраняем…':value==='offline'?'Только чтение':'')
  updateSteps();renderHistory();announce(state.selectedOptions[0].textContent)
}
state.addEventListener('change',setState)
document.querySelector('#placeholder').addEventListener('click',e=>{if(e.target.closest('[data-report-retry]')){state.value='ready';setState();document.querySelector('#title').setAttribute('tabindex','-1');document.querySelector('#title').focus()}})
chooseChapter('forecast');handleHash();setState()
matchMedia('(max-width:700px)').addEventListener('change',()=>{
  const panel=document.querySelector('#forecast-content .financial-chart')
  panel.outerHTML=graph(forecastSeries)
  renderStress()
})
