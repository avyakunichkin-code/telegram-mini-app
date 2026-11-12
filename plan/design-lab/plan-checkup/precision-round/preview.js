const names={incomes:'Доходы',expenses:'Расходы',savings:'Накопления',liabilities:'Кредиты'}
const order=['incomes','expenses','liabilities','savings']
const initial={incomes:[{min:120000,max:120000}],expenses:[{min:20000,max:100000}],savings:[{min:270000,max:270000}],liabilities:[{monthly_payment:30000,estimated:true}]}
let data=structuredClone(initial),saved=structuredClone(initial),active='expenses',rangeMode=true,timer=null
const $=s=>document.querySelector(s)
const levels={empty:'Нет сумм для оценки',draft:'Черновые данные',approximate:'Приблизительные данные',refined:'Уточнённые данные'}
function inputValue(id){const raw=$(id).value.trim().replace(/\s/g,'').replace(',','.');return raw===''?NaN:Number(raw)}
function blocked(){return ['saving','offline'].includes($('#state').value)||Boolean(timer)}
function valid(){const min=inputValue('#min'),max=rangeMode?inputValue('#max'):min;return Number.isFinite(min)&&Number.isFinite(max)&&min>=0&&max>=min}
function evaluate(){
 const result=window.PrecisionModel.analyze(data)
 $('#precision').textContent=levels[result.level]
 $('#precision').dataset.level=result.level
 const section=result.candidate?.key
 $('#guide-title').textContent=section?`Сначала — ${names[section].toLowerCase()}`:result.total?'Заметных неопределённостей нет':'Начните с любой суммы'
 $('#guide-reason').textContent=section==='liabilities'?'Платёж известен, остаток долга пока оценён.':section?'Здесь наибольший вклад неточных сумм.':'Это оценка заполнения, не проверка всех рисков.'
 $('#goto').disabled=blocked()||!section
 $('#inline-copy').textContent=section===active?'Уточните эту сумму первой — она сильнее влияет на оценку.':section?`Больше всего поможет раздел «${names[section]}».`:'Данные можно сохранить.'
 $('#math').textContent=result.total?`Доля уточнённых сумм: ${Math.round(result.share*100)} %. Пороги оценки: 50 % и 85 %. Кредиты из быстрого старта считаются оценочными.`:'Для оценки нужны ненулевые суммы.'
 $('#invalid').hidden=valid()||$('#empty-note').hidden===false
 const lo=inputValue('#min'),hi=rangeMode?inputValue('#max'):lo
 const wide=window.PrecisionModel.broad(lo,hi)
 $('#warning').hidden=!wide||active==='liabilities'
 $('#warning').textContent=lo===0?'От нуля — широкий разброс. Сохранить можно.':'Широкий диапазон. Сохранить можно.'
 $('#sections').querySelectorAll('button').forEach(button=>{
  const row=result.contributions.find(r=>r.key===button.dataset.key)
  button.querySelector('small').textContent=!row.weight?'Нет сумм':row.uncertain?'Есть оценки':'Уточнено'
  button.disabled=blocked()
 })
 for(const element of document.querySelectorAll('#editor input,#editor button,#save,#next'))element.disabled=blocked()||(element.id==='ranged'&&active==='liabilities')||(['save','next'].includes(element.id)&&!valid()&&$('#empty-note').hidden)
 $('#save').textContent=blocked()&&$('#state').value!=='offline'?'Сохраняем…':'Сохранить'
 $('#preview-label').textContent='Оценка по текущему вводу · ещё не отчёт'
}
function render(){
 $('#sections').innerHTML=order.map((key,i)=>`<button type="button" data-key="${key}" aria-current="${key===active?'step':'false'}"><span>${String(i+1).padStart(2,'0')}</span><b>${names[key]}</b><small></small></button>`).join('')
 $('#section-title').textContent=names[active]
 $('#position').textContent=`Раздел ${order.indexOf(active)+1} из 4 · демо-фрагмент`
 const row=data[active]?.[0]
 $('#empty-note').hidden=Boolean(row)
 $('#editor').hidden=!row
 $('#amount-label').textContent=active==='savings'?'Сумма накоплений':active==='liabilities'?'Ежемесячный платёж':'В месяц'
 if(row){$('#min').value=active==='liabilities'?row.monthly_payment:row.min;$('#max').value=active==='liabilities'?row.monthly_payment:row.max;rangeMode=active!=='liabilities'&&row.min!==row.max}
 $('#ranged').disabled=active==='liabilities'
 $('#max-field').hidden=!rangeMode;$('#dash').hidden=!rangeMode
 $('#min-label').textContent=rangeMode?'От':'Сумма'
 $('#ranged').setAttribute('aria-pressed',String(rangeMode));$('#exact').setAttribute('aria-pressed',String(!rangeMode))
 $('#field-help').textContent=active==='liabilities'?'Остаток долга оценён по платежу. Для уточнения нужны условия договора.':'Можно оставить примерно. Сумму уточните позже.'
 $('#notice').textContent=$('#state').value==='offline'?'Офлайн · только чтение.':''
 evaluate()
 if(active==='liabilities')$('#ranged').disabled=true
}
function update(){
 if(!valid()){evaluate();return}
 const min=inputValue('#min'),max=rangeMode?inputValue('#max'):min
 if(active==='liabilities')data[active][0].monthly_payment=min
 else data[active][0]={min,max}
 $('#notice').textContent='';evaluate()
}
$('#min').addEventListener('input',update);$('#max').addEventListener('input',update)
$('#ranged').addEventListener('click',()=>{rangeMode=true;$('#max-field').hidden=false;$('#dash').hidden=false;$('#max').value=$('#min').value;$('#min-label').textContent='От';$('#ranged').setAttribute('aria-pressed','true');$('#exact').setAttribute('aria-pressed','false');update()})
$('#exact').addEventListener('click',()=>{rangeMode=false;$('#max-field').hidden=true;$('#dash').hidden=true;$('#min-label').textContent='Сумма';$('#ranged').setAttribute('aria-pressed','false');$('#exact').setAttribute('aria-pressed','true');update()})
$('#sections').addEventListener('click',e=>{const button=e.target.closest('[data-key]');if(!button||blocked())return;active=button.dataset.key;render()})
$('#goto').addEventListener('click',()=>{const target=window.PrecisionModel.analyze(data).candidate?.key;if(target){active=target;render();$('#min').focus()}})
document.querySelectorAll('[name=variant]').forEach(radio=>radio.addEventListener('change',()=>document.body.dataset.variant=radio.value))
function save(next=false){
 if(blocked()||!valid()&&$('#empty-note').hidden)return
 $('#error').hidden=true;timer=setTimeout(()=>{
  timer=null
  if($('#state').value==='error')$('#error').hidden=false
  else{saved=structuredClone(data);$('#notice').textContent='Сохранено в демо';if(next){active=order[(order.indexOf(active)+1)%order.length];render()}}
  evaluate()
 },500);evaluate()
}
$('#save').addEventListener('click',()=>save());$('#next').addEventListener('click',()=>save(true));$('#retry').addEventListener('click',()=>{$('#state').value='ready';save()})
$('#state').addEventListener('change',()=>{
 clearTimeout(timer);timer=null;data=structuredClone(initial);active='expenses';$('#error').hidden=true
 if($('#state').value==='empty')data={}
 if($('#state').value==='zero')data.expenses[0]={min:0,max:100000}
 render()
})
$('#reset').addEventListener('click',()=>{clearTimeout(timer);timer=null;data=structuredClone(initial);saved=structuredClone(initial);active='expenses';$('#state').value='ready';$('#error').hidden=true;render()})
document.body.dataset.variant='inline';render()
