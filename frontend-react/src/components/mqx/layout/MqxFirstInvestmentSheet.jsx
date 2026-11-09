import { useEffect, useId, useRef, useState } from 'react';
import { MoneyText } from '../../MoneyText';
import { formatIntGrouped } from '../../../utils/numberFields';
import { MqxCapitalSheet } from './MqxCapitalSheet';

/** Approved compact A: direct product choice, existing bottom-sheet shell. */
export function MqxFirstInvestmentSheet({ product, amount, maxCash, annualRatePercent, expenses = 0, onAmountChange, onSubmit, onClose }) {
  const id=useId();
  const sending=useRef(false);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const isDeposit=product==='deposit';
  const valid=Number.isSafeInteger(amount)&&amount>0&&amount<=maxCash;
  const remaining=maxCash-amount;
  const close=()=>{if(!sending.current)onClose();};
  useEffect(()=>{
    const previous=document.activeElement;
    document.getElementById(id)?.focus({preventScroll:true});
    return ()=>{
      const target=previous?.isConnected?previous:document.querySelector('.mqx-cap-seg [aria-selected="true"]');
      target?.focus?.({preventScroll:true});
    };
  },[id]);
  useEffect(()=>{
    const keydown=e=>{
      const dialog=document.getElementById(id)?.closest('[role="dialog"]');
      if(!dialog)return;
      if(e.key==='Escape'){e.preventDefault();if(!sending.current)onClose();return;}
      if(e.key!=='Tab')return;
      const items=[...dialog.querySelectorAll('button:not(:disabled),input:not(:disabled)')];
      const first=items[0],last=items.at(-1);
      if(!first){e.preventDefault();return;}
      if(e.shiftKey&&(document.activeElement===first||!items.includes(document.activeElement))){e.preventDefault();last.focus();}
      else if(!e.shiftKey&&(document.activeElement===last||!items.includes(document.activeElement))){e.preventDefault();first.focus();}
    };
    document.addEventListener('keydown',keydown);
    return ()=>document.removeEventListener('keydown',keydown);
  },[id,onClose]);
  const submit=async e=>{
    e.preventDefault();
    if(!valid||sending.current)return;
    sending.current=true;setBusy(true);setError('');
    try{await onSubmit();}
    catch(err){setError(typeof err?.detail==='string'?err.detail:'Не удалось выполнить операцию. Сумма сохранена — попробуй ещё раз.');}
    finally{sending.current=false;setBusy(false);}
  };
  return <MqxCapitalSheet open portal lockScroll busy={busy} title={isDeposit?'Вклад':'Облигации'} titleId={id}
    subtitle={`${annualRatePercent}% в год · игровые условия`} onClose={close}
    sheetClassName="mqx-sheet--amount mqx-first-investment">
    <form onSubmit={submit} className="mqx-first-investment__form" aria-busy={busy}>
      <div className="mqx-first-investment__main">
        <label htmlFor={`${id}-amount`}>{isDeposit?'Сколько отложим?':'Сколько вложим?'}</label>
        <div className="mqx-first-investment__amount"><input id={`${id}-amount`} type="text" inputMode="numeric" autoComplete="off"
          aria-label="Сумма" aria-describedby={`${id}-cash`} value={formatIntGrouped(amount)} placeholder="0" disabled={busy||maxCash<=0}
          onChange={e=>{const value=Number(e.target.value.replace(/[^\d]/g,''));if(Number.isSafeInteger(value))onAmountChange(value);setError('');}}/>
          <span aria-hidden="true">₽</span></div>
        <p className="mqx-first-investment__hint" id={`${id}-cash`}>На счёте <MoneyText value={maxCash} decimals={0}/></p>
        <div className="mqx-first-investment__presets">{[1000,5000,10000].map(value=><button key={value} type="button" disabled={busy||value>maxCash}
          onClick={()=>{onAmountChange(value);setError('');}}><MoneyText value={value} decimals={0}/></button>)}</div>
        <div className="mqx-first-investment__remaining"><span>Останется на счёте</span><strong>{valid?<MoneyText value={remaining} decimals={0}/>:'—'}</strong></div>
        {amount>maxCash?<p className="mqx-first-investment__warning" role="alert">На счёте не хватает денег на эту сумму.</p>
          :maxCash<=0?<p className="mqx-first-investment__warning" role="note">Нет средств на счёте.</p>
          :valid&&remaining<expenses?<p className="mqx-first-investment__warning" role="note">На счёте останется меньше расходов за ход. Подушка не оплачивает их автоматически.</p>:null}
        {error?<p className="mqx-first-investment__warning" role="alert">{error}</p>:null}
      </div>
      <div className="mqx-first-investment__footer"><button type="submit" className="mqx-bg-btn mqx-first-investment__submit" disabled={busy||!valid}>
        {busy?'Выполняем…':<>{isDeposit?'Открыть вклад':'Купить облигации'}{valid?<> · <MoneyText value={amount} decimals={0}/></>:null}</>}</button>
        <p className="mqx-first-investment__hint">Сумма спишется со счёта сразу. Игровые условия.</p>
      </div>
    </form>
  </MqxCapitalSheet>;
}
