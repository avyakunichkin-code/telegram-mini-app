import { useEffect, useRef, useState } from 'react'
import { api, getToken } from '../api.js'
import { Button, ErrorNote } from '../components.jsx'
import { QUESTIONS, historyValue, historyDelta, wideValues, label, monthLabel, reportDate } from './history-format.js'
import './history.css'

const LIGHTS = { green: 'В порядке', yellow: 'Есть вопросы', red: 'Нужен разбор' }
const KEYS = ['budget', 'debts', 'cushion', 'protection']
const NAMES = { budget: 'Бюджет', debts: 'Долги', cushion: 'Подушка', protection: 'Защита' }
function Risk({ area }) {
  return <span><i className={`history-dot history-dot-${area?.light || 'unknown'}`} aria-hidden="true" />{area ? LIGHTS[area.light] || 'Нет данных' : 'Нет данных'}</span>
}

/** Approved hybrid 2, own Plan styling; only shared native ButtonBase underneath. */
export default function History({ readOnly, onOpen, onDraft, onNew, onUnauthorized }) {
  const [items, setItems] = useState(null)
  const [error, setError] = useState(null)
  const [retry, setRetry] = useState(0)
  const [before, setBefore] = useState(null), [after, setAfter] = useState(null)
  const [comparison, setComparison] = useState(null)
  const [comparing, setComparing] = useState(false)
  const [compareError, setCompareError] = useState(null), [compareRetry, setCompareRetry] = useState(0)
  const unauthorized = useRef(onUnauthorized)
  unauthorized.current = onUnauthorized

  useEffect(() => {
    let active = true
    const session = getToken()
    setItems(null); setComparison(null); setError(null)
    if (readOnly) return () => { active = false }
    api.listCheckups().then(list => {
      if (!active || getToken() !== session) return
      setItems(list)
      const done = list.filter(c => c.status === 'completed' && c.report_available)
      setAfter(done[0]?.id || null); setBefore(done[1]?.id || null)
    }).catch(err => {
      if (!active || getToken() !== session) return
      if (err.status === 401) unauthorized.current()
      else setError(err)
    })
    return () => { active = false }
  }, [readOnly, retry])

  useEffect(() => {
    let active = true
    const session = getToken()
    setComparison(null); setCompareError(null)
    if (readOnly || !before || !after || !items) { setComparing(false); return () => { active = false } }
    setComparing(true)
    api.compareCheckups(after, before).then(result => {
      if (active && getToken() === session) setComparison(result)
    }).catch(err => {
      if (!active || getToken() !== session) return
      if (err.status === 401) unauthorized.current()
      else setCompareError(err)
    }).finally(() => { if (active) setComparing(false) })
    return () => { active = false }
  }, [before, after, items, readOnly, compareRetry])

  const done = (items || []).filter(c => c.status === 'completed')
  const available = done.filter(c => c.report_available)
  const draft = items?.find(c => c.status === 'draft')
  function choose(current) {
    const index = available.findIndex(c => c.id === current)
    if (available.length < 2) return
    setAfter(available[Math.min(index, available.length - 2)].id)
    setBefore(available[Math.min(index + 1, available.length - 1)].id)
  }
  const record = c => <article key={c.id} className={`h-record ${c.id === before ? 'h-before' : c.id === after ? 'h-after' : ''}`}>
    <div><span className="h-record-date">{label(c, done.length - done.indexOf(c))}</span>{(c.id === before || c.id === after) && <span className="h-tag">{c.id === after ? 'Стало' : 'Было'}</span>}</div>
    <h3>{c.question || QUESTIONS[c.entry_question] || 'Финансовый разбор'}</h3>
    <div className="h-risk-dots">{KEYS.map(key => <div key={key}>{NAMES[key]}: <Risk area={c.areas?.find(a => a.key === key)} /></div>)}</div>
    <p className="h-record-meta">Данные: {monthLabel(c.as_of)} · {c.rules_version == null ? 'Версия неизвестна' : `v${c.rules_version}`}</p>
    <Button variant="secondary" disabled={!c.report_available} onClick={() => onOpen(c.id)}>{c.report_available ? 'Открыть отчёт ↗' : 'Отчёт недоступен'}</Button>
  </article>
  const archive = <aside className="h-archive history"><p className="h-section-label">Сохранённые записи</p>{done.map(record)}</aside>


  return <section className="plan-history" aria-label="История разборов">
    <div className="history-heading"><div><p className="eyebrow">Профиль / История разборов</p><h2>Ваш финансовый журнал.</h2><p className="muted">Возвращайтесь к прежним ответам и смотрите, как меняется положение семьи.</p></div><Button disabled={readOnly} onClick={onNew}>Новый чекап</Button></div>
    {readOnly ? <p role="status">Для истории и сравнения нужна сеть. Последний сохранённый отчёт доступен в разделе «Разбор».</p>
      : error ? <><ErrorNote error={error} /><Button variant="secondary" onClick={() => setRetry(n => n + 1)}>Повторить загрузку</Button></>
        : !items ? <p role="status">Загружаем историю…</p>
          : !done.length ? <div className="history-empty"><h3>Здесь появится ваша история.</h3><p>Завершите первый чекап — его результат останется в истории.</p></div>
            : <>
              <div className="h-topline"><span>{new Set(done.map(c => c.as_of.slice(0, 4))).size === 1 ? done[0].as_of.slice(0, 4) : 'История'} <small>финансовый журнал</small></span><nav className="h-months" aria-label="Записи по месяцам">{available.slice(0, 3).reverse().map(c => <button key={c.id} disabled={available.length < 2} aria-pressed={c.id === after} onClick={() => choose(c.id)}><span>{monthLabel(c.as_of)}</span><small>{c.id === after ? 'Сейчас' : c.id === before ? 'Было' : 'Запись'} · №{available.length - available.indexOf(c)}</small></button>)}</nav></div>
              <div className="h-layout">{archive}<section className="hybrid-panel" aria-label="Сравнение отчётов" aria-busy={comparing}>
                {available.length < 2 ? <div className="history-empty"><h3>{available.length ? 'У истории есть начало.' : 'Сохранённые отчёты недоступны.'}</h3><p>{available.length ? 'Для сравнения нужен второй итоговый отчёт. Первый уже можно открыть.' : 'Прошлые расчёты не пересоздаются автоматически.'}</p>{available.length === 1 && <Button variant="secondary" onClick={() => onOpen(available[0].id)}>Открыть первый отчёт</Button>}</div>
                  : <>
                    <div className="h-controls"><div className="h-presets"><Button variant="secondary" aria-pressed={after === available[0]?.id && before === available[1]?.id} onClick={() => { setAfter(available[0].id); setBefore(available[1].id) }}>С предыдущим</Button><Button variant="secondary" aria-pressed={after === available[0]?.id && before === available.at(-1)?.id} onClick={() => { setAfter(available[0].id); setBefore(available.at(-1).id) }}>С первым чекапом</Button></div>
                      <div className="h-selectors"><label>Было<select value={before || ''} onChange={e => setBefore(e.target.value)}>{available.map((c, i) => <option key={c.id} value={c.id} disabled={i <= available.findIndex(x => x.id === after)}>{label(c, available.length - i)}</option>)}</select></label><span aria-hidden="true">→</span><label>Стало<select value={after || ''} onChange={e => setAfter(e.target.value)}>{available.map((c, i) => <option key={c.id} value={c.id} disabled={i >= available.findIndex(x => x.id === before)}>{label(c, available.length - i)}</option>)}</select></label></div>
                    </div>
                    {compareError ? <><ErrorNote error={compareError} /><Button variant="secondary" onClick={() => setCompareRetry(n => n + 1)}>Повторить сравнение</Button></>
                      : !comparison ? <p role="status">Сравниваем сохранённые отчёты…</p>
                        : <>
                          {comparison.versions_differ && <p className="history-notice">Версии расчёта различаются. Числа сохранены как есть; смена цвета может быть связана с правилами.</p>}
                          <div className="h-margin-note"><span>Заметка к сравнению</span><b>{historyDelta(comparison.metrics[0])}{comparison.metrics[0].delta == null || comparison.metrics[0].delta === 0 ? '' : ' / мес.'}</b><small>свободного остатка</small></div>
                          <div className="h-table-sheet"><div className="h-table-title"><h3>Пять ориентиров</h3><span>{reportDate(comparison.before.completed_at)} → {reportDate(comparison.after.completed_at)}</span></div><table className="h-metrics"><caption className="history-sr">Сравнение пяти метрик сохранённых отчётов</caption><thead><tr><th scope="col">Показатель</th><th scope="col">Было</th><th scope="col">Стало</th><th scope="col">Изменение</th></tr></thead><tbody>{comparison.metrics.map((m, i) => <tr key={m.key} className={wideValues(m) ? 'h-wide-values' : ''}><th scope="row"><span className="h-index" aria-hidden="true">0{i + 1}</span>{m.title}</th><td data-label="Было">{historyValue(m.before, m.unit)}</td><td data-label="Стало" className="h-current">{historyValue(m.after, m.unit)}</td><td data-label="Изменение" className="h-delta">{historyDelta(m)}</td></tr>)}</tbody></table></div>
                          <section className="h-areas"><h3>Четыре области</h3><div>{KEYS.map(key => <div className="h-area" key={key}><b>{NAMES[key]}</b><Risk area={comparison.before.areas?.find(a => a.key === key)} /><span className="h-arrow" aria-hidden="true">→</span><Risk area={comparison.after.areas?.find(a => a.key === key)} /></div>)}</div></section>
                          <p className="h-footnote">Данные: {monthLabel(comparison.before.as_of)} → {monthLabel(comparison.after.as_of)}. Расчёты v{comparison.before.rules_version ?? '?'} / v{comparison.after.rules_version ?? '?'}. Сохранённые отчёты не пересчитываются. Разница не объясняет причины изменений.</p>
                        </>}
                  </>}
              </section></div>
              <details className="h-mobile-archive"><summary>Открыть сохранённый отчёт · {done.length}</summary>{archive}</details>
            </>}
    {draft && !readOnly && <aside className="history-draft"><div><b>Продолжим, когда будете готовы.</b><p>Черновик за {monthLabel(draft.as_of)} сохранён отдельно от итоговых отчётов.</p></div><Button variant="secondary" onClick={() => onDraft(draft.id)}>К черновику →</Button></aside>}
  </section>
}
