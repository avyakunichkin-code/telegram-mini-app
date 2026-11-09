const informationControl=document.createElement('fieldset')
informationControl.className='information-control'
informationControl.innerHTML='<legend>Подача информации</legend><label><input type="radio" name="information" value="beacon" checked> C1 · Акцент</label><label><input type="radio" name="information" value="brief"> C2 · Сводка</label><label><input type="radio" name="information" value="path"> C3 · По шагам</label>'
document.querySelector('.lab').append(informationControl)
const informationNote=document.createElement('p')
informationNote.className='information-note'
informationNote.setAttribute('role','status')
document.querySelector('.lab').after(informationNote)
const descriptions={beacon:'C1 · Главный вывод выделен цветом. Действие — отдельная кнопка.',brief:'C2 · Компактная сводка: что известно и что можно сделать.',path:'C3 · Сначала ситуация, затем опора и следующий шаг.'}
const actionHint=document.createElement('div')
actionHint.className='action-heading'
actionHint.innerHTML='<span>Можно сделать сейчас</span><span class="action-key"><i aria-hidden="true">↗</i> Нажмите, чтобы открыть</span>'
document.querySelector('#live-steps').before(actionHint)
const firstSummary=document.querySelector('#live-steps>.step>summary')
const firstBody=document.querySelector('#live-steps>.step>.step-body')
firstBody.id='primary-action-body'
const actionTrigger=document.createElement('span')
actionTrigger.className='action-trigger'
actionTrigger.textContent='Открыть шаг'
firstSummary.querySelector('.expand').replaceWith(actionTrigger)
document.querySelector('#live-steps>.step').addEventListener('toggle',event=>{actionTrigger.textContent=event.currentTarget.open?'Свернуть':'Открыть шаг'})
document.querySelector('.answer-next').hidden=true
const answerBand=document.querySelector('.answer-band')
const infoTag=document.createElement('span');infoTag.className='information-tag';infoTag.textContent='Главное'
answerBand.querySelector('div').prepend(infoTag)
document.querySelectorAll('.answer-metrics article').forEach(article=>{
 const marker=document.createElement('span');marker.className='data-label';marker.textContent='По вашим данным';article.prepend(marker)
})
function setInformation(value){
 document.body.dataset.information=value
 informationNote.textContent=descriptions[value]
}
informationControl.addEventListener('change',e=>{if(e.target.name==='information')setInformation(e.target.value)})
setInformation('beacon')
