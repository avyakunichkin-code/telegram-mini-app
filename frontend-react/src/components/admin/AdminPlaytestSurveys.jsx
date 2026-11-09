import { useEffect, useState } from 'react';
import { getPlaytestSurveyResponses } from '../../api/admin';
import { surveyQuestionsForVersion } from '../../utils/playtestSurvey';
import { formatAdminDt } from './adminFormat';

function SurveyVersionTable({ surveyKey, rows }) {
  const questions=surveyQuestionsForVersion(surveyKey);
  return <div className="admin-watchtower__table-wrap"><table className="admin-watchtower__table">
    <caption>{surveyKey} · {questions.length} вопросов · {rows.length} ответов</caption>
    <thead><tr><th>Партия / опрос</th><th>Закрыто ходов</th>{questions.map(q=><th key={q.key}>{q.title}</th>)}<th>Отзыв</th></tr></thead>
    <tbody>{rows.map(row=><tr key={row.id}>
      <td>#{row.game_profile_id}<br/>{row.template_key}<br/>{row.survey_key}<br/>{formatAdminDt(row.submitted_at)}</td>
      <td>{row.closed_turns}</td>{questions.map(q=><td key={q.key}>{q.options.find(([v])=>v===row.answers[q.key])?.[1]??'—'}</td>)}
      <td>{row.comment?<details><summary>Прочитать отзыв</summary><p>{row.comment}</p></details>:'Без текста'}</td>
    </tr>)}</tbody></table></div>;
}

export function AdminPlaytestSurveys() {
  const [rows,setRows]=useState(null);
  const [error,setError]=useState('');
  const [version,setVersion]=useState(0);
  useEffect(()=>{
    let cancelled=false;
    setRows(null);setError('');
    getPlaytestSurveyResponses().then(data=>{if(!cancelled)setRows(data.responses);})
      .catch(()=>{if(!cancelled)setError('Не удалось загрузить ответы опроса.');});
    return ()=>{cancelled=true;};
  },[version]);
  return <section className="mq-card admin-watchtower__block">
    <h2 className="admin-watchtower__block-title">Опрос первых ходов</h2>
    <button type="button" className="admin-watchtower__filter-chip" onClick={()=>setVersion(v=>v+1)}>Обновить ответы</button>
    {error?<p role="alert">{error}</p>:rows===null?<p role="status">Загружаем ответы…</p>:rows.length===0?<p>Пока никто не ответил.</p>:
      <>{[...new Set(rows.map(row=>row.survey_key))].map(key=><SurveyVersionTable key={key} surveyKey={key} rows={rows.filter(row=>row.survey_key===key)}/>)}
        <p className="mq-muted">Последние 50 ответов. Версии опроса показаны отдельно. Отзывы после финала — в разделе «Отзывы».</p></>}
  </section>;
}
