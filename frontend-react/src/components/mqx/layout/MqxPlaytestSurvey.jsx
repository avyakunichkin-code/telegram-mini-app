import { useEffect, useId, useRef, useState } from 'react';
import { MqxCapitalSheet } from './MqxCapitalSheet';
import { MqxButton } from '../primitives/MqxButton';
import { PLAYTEST_SURVEY_KEY, SURVEY_STEPS, isSurveyStepComplete } from '../../../utils/playtestSurvey';

/** One sheet, versioned question groups and an optional free-text review. */
export function MqxPlaytestSurvey({ open, mode = 'form', profileId, onClose, onStart, onSubmit }) {
  const titleId=useId();
  const [step,setStep]=useState(0);
  const [answers,setAnswers]=useState({});
  const [comment,setComment]=useState('');
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const [sent,setSent]=useState(false);
  const sendingRef=useRef(false);
  const done=sent||mode==='success';
  const lastStep=SURVEY_STEPS.length-1;

  useEffect(()=>{
    if(!open)return undefined;
    const previous=document.activeElement;
    return ()=>{if(previous?.isConnected)previous.focus?.({preventScroll:true});};
  },[open]);
  useEffect(()=>{
    if(open)document.getElementById(titleId)?.focus({preventScroll:true});
  },[open,step,mode,done,titleId]);
  useEffect(()=>{
    if(!open)return undefined;
    const keydown=e=>{
      const dialog=document.getElementById(titleId)?.closest('[role="dialog"]');
      if(!dialog)return;
      if(e.key==='Escape'){e.preventDefault();if(!busy)onClose?.(done);return;}
      if(e.key!=='Tab')return;
      const elements=[...dialog.querySelectorAll('button:not(:disabled),input:not(:disabled),textarea:not(:disabled),[tabindex="0"]')].filter(el=>el.getClientRects().length);
      const first=elements[0],last=elements.at(-1);
      if(!first){e.preventDefault();return;}
      if(e.shiftKey&&(document.activeElement===first||!elements.includes(document.activeElement))){e.preventDefault();last.focus();}
      else if(!e.shiftKey&&(document.activeElement===last||!elements.includes(document.activeElement))){e.preventDefault();first.focus();}
    };
    document.addEventListener('keydown',keydown);
    return ()=>document.removeEventListener('keydown',keydown);
  },[open,busy,onClose,done,titleId]);

  const submit=async e=>{
    e.preventDefault();
    if(sendingRef.current||!isSurveyStepComplete(step,answers))return;
    if(step<lastStep){setStep(step+1);setError('');return;}
    if(!SURVEY_STEPS.every((_,i)=>isSurveyStepComplete(i,answers)))return;
    sendingRef.current=true;setBusy(true);setError('');
    try{await onSubmit({profile_id:profileId,survey_key:PLAYTEST_SURVEY_KEY,answers,comment:comment.trim()});setSent(true);}
    catch(err){setError(err?.status===409?'Этот опрос уже отправлен. Закрой окно и обнови игру.':'Не удалось отправить. Ответы на месте — попробуй ещё раз.');}
    finally{sendingRef.current=false;setBusy(false);}
  };
  const title=done?'Спасибо за ответы!':mode==='invite'?'Как тебе первые ходы?':SURVEY_STEPS[step].title;
  return <MqxCapitalSheet open={open} portal lockScroll busy={busy} title={title} titleId={titleId}
    onClose={()=>onClose?.(done)} sheetClassName="mqx-sheet--amount mqx-survey">
    {done?<div className="mqx-survey__message"><p>Твой ответ получен. Он поможет сделать игру понятнее.</p><MqxButton variant="primary" stretched onClick={()=>onClose?.(true)}>Вернуться в игру</MqxButton></div>
      :mode==='invite'?<div className="mqx-survey__message"><p>Девять вопросов и свободный отзыв на трёх шагах.</p><p className="mqx-survey__hint">Добровольно · пара минут · без награды</p><MqxButton variant="primary" stretched onClick={onStart}>Ответить</MqxButton><MqxButton variant="link" stretched onClick={()=>onClose?.(false)}>Позже</MqxButton></div>
      :<form className="mqx-survey__form" onSubmit={submit}>
        <p className="mqx-survey__progress" aria-live="polite">Шаг {step+1} из {SURVEY_STEPS.length}</p>
        {error?<p className="mqx-survey__error" role="alert">{error}</p>:null}
        <div className="mqx-survey__questions">
          {SURVEY_STEPS[step].questions.map(q=><fieldset key={q.key} className="mqx-survey__question" disabled={busy}>
            <legend>{q.title}</legend><div className={`mqx-survey__options${q.key==='difficulty'?' mqx-survey__options--difficulty':''}`}>{q.options.map(([value,label])=><label className="mqx-survey__option" key={String(value)}>
              <input type="radio" name={`${titleId}-${q.key}`} checked={answers[q.key]===value} onChange={()=>setAnswers(a=>({...a,[q.key]:value}))}/>{label}
            </label>)}</div></fieldset>)}
          {step===lastStep?<div className="mqx-survey__review"><label htmlFor={`${titleId}-comment`}>Расскажи своими словами <span className="mqx-survey__hint">Необязательно</span></label>
            <textarea id={`${titleId}-comment`} value={comment} onChange={e=>setComment(e.target.value)} maxLength={1000} rows={3} disabled={busy} placeholder="Что понравилось, чего не хватило или где застрял?"/>
            <p className="mqx-survey__hint">До 1000 символов. Не указывай личные данные. Ответ увидит команда игры.</p></div>:null}
        </div>
        <div className="mqx-survey__footer"><div className="mqx-survey__actions">
          {step>0?<MqxButton variant="secondary" disabled={busy} onClick={()=>{setStep(step-1);setError('');}}>Назад</MqxButton>:null}
          <MqxButton variant="primary" type="submit" stretched disabled={busy||!isSurveyStepComplete(step,answers)}>{busy?'Отправляем…':step<lastStep?'Дальше':'Отправить ответы'}</MqxButton>
        </div><p className="mqx-survey__hint">{busy?'Отправляем ответ…':'Добровольно. Можно закрыть в любой момент.'}</p></div>
      </form>}
  </MqxCapitalSheet>;
}
