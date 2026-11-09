import { useState } from 'react';
import { MqxPlaytestSurvey } from '../layout/MqxPlaytestSurvey';
import { MqxButton } from '../primitives/MqxButton';

export function MqxPlaytestSurveyDemo() {
  const [mode,setMode]=useState(null);
  const [fail,setFail]=useState(false);
  return <>
    <p>Анкета v2: девять вопросов на трёх шагах, включая сложность и свободный отзыв. Демо не отправляет данные.</p>
    <MqxButton variant="secondary" onClick={()=>setMode('invite')}>Приглашение к опросу</MqxButton>
    <MqxButton variant="secondary" onClick={()=>setMode('form')}>Открыть опрос</MqxButton>
    <label><input type="checkbox" checked={fail} onChange={e=>setFail(e.target.checked)}/>Ошибка отправки</label>
    {mode?<MqxPlaytestSurvey open mode={mode} profileId={42} onClose={()=>setMode(null)}
      onStart={()=>setMode('form')} onSubmit={async()=>{if(fail)throw new Error('Synthetic error');}}/>:null}
  </>;
}
