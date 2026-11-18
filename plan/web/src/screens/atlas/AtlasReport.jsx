import { useEffect, useRef, useState } from 'react'
import DecisionValue from './DecisionValue.jsx'
import Insights from './Insights.jsx'
import { Button, ErrorNote, Light, LineChart, Money } from '../../components.jsx'
import { monthLabel, rub } from '../../format.js'
import { AreaMetrics, DebtStrategy } from '../ReportDetails.jsx'
import StepActions from '../StepActions.jsx'
import PreviousStepBridge from '../PreviousStepBridge.jsx'
import GoalRoutes from '../GoalRoutes.jsx'
import History from '../History.jsx'
import './atlas.css'

const TABS = [['answer', 'Ответ', 'check'], ['forecast', 'Прогноз', 'chart'], ['stress', 'Устойчивость', 'shield'], ['debts', 'Долги', 'debt'], ['history', 'История', 'clock']]
const PATHS = { check: 'm5 12 4 4 10-10', chart: 'M4 18h16M5 14l5-5 4 3 5-7', shield: 'M12 3 4 6v6c0 4 8 9 8 9s8-5 8-9V6zM12 8v5m0 3v.1', debt: 'M5 5h14v14H5zM8 9h8m-8 4h5', clock: 'M4 8a8 8 0 1 1-1 7M4 3v5h5m3 0v5l3 2' }
const precision = { draft: 'Черновые данные', approximate: 'Приблизительные данные', refined: 'Уточнённые данные' }

function Step({ step, final, readOnly, onUpdate, first }) {
  const [open, setOpen] = useState(false)
  return <details className={`atlas-step ${first ? 'first-step-ticket' : ''} ${step.status === 'done' ? 'is-complete' : ''}`} open={open} onToggle={e => setOpen(e.currentTarget.open)}>
    <summary><span className="atlas-step-rank" aria-hidden="true">{step.status === 'done' ? '✓' : String(step.rank).padStart(2, '0')}</span><span><b>{step.title}</b>{step.status === 'done' && <span className="atlas-complete">✓ Выполнено</span>}{step.status === 'dismissed' && <span className="atlas-complete">Отложено</span>}</span><span className="atlas-trigger">{open ? 'Свернуть' : 'Открыть шаг'} <span aria-hidden="true">↗</span></span></summary>
    <div className="atlas-step-body"><p>{step.why}</p><StepActions step={step} final={final} readOnly={readOnly} onUpdate={onUpdate} expanded /></div>
  </details>
}

function Values({ series }) {
  if (!series[0]?.points?.length) return <p>Нет данных прогноза.</p>
  return <details className="atlas-disclosure"><summary>Значения по месяцам</summary><div className="atlas-table" role="region" aria-label="Значения прогноза" tabIndex={0}><table><caption>Остаток на конец месяца</caption><thead><tr><th scope="col">Месяц</th>{series.map(s => <th scope="col" key={s.name}>{s.name}</th>)}</tr></thead><tbody>{series[0].points.map((p, i) => <tr key={p.month}><th scope="row">{monthLabel(p.month)}</th>{series.map(s => <td key={s.name}>{rub(s.points[i]?.liquid)}</td>)}</tr>)}</tbody></table></div></details>
}

export default function AtlasReport({ checkup, report, onRefine, onComplete, onNew, onReport, onOpenPrevious, onReturn, onHistoryDraft, onUnauthorized, readOnly = false, offlineSavedAt = null }) {
  const [tab, setTab] = useState('answer')
  const [scenarioIndex, setScenarioIndex] = useState(0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const tabs = useRef([])
  const question = useRef(null)
  useEffect(() => { setTab('answer'); setScenarioIndex(0); setError(null) }, [checkup.id])
  const draft = report.precision === 'draft'
  const cushion = report.areas.find(a => a.key === 'cushion')
  const outflow = report.metrics_base.outflow
  const [first, ...others] = report.steps
  const previous = report.previous_steps
  const scenario = report.scenarios[scenarioIndex] || report.scenarios[0]
  const stressValues = report.scenarios.flatMap(s => s.series.map(p => p.liquid))
  const stressDomain = [Math.min(0, ...stressValues), Math.max(1, ...stressValues)]
  const overviewReserveGap = checkup.entry_question === 'overview' && report.free_cashflow > 0 && cushion?.light === 'yellow' && cushion.metrics.months < cushion.metrics.target_months && report.areas.filter(a => a.key !== 'cushion').every(a => a.light === 'green') && report.entry_answer.verdict !== 'fail'
  const incomeLoss = report.scenarios.find(s => s.id === 'S1')
  const series = [{ name: 'Базовый', tone: 'ok', points: report.forecast.base }, { name: 'Пессимистичный', tone: 'pess', points: report.forecast.pessimistic }]
  const update = fresh => onReport(current => current ? { ...current, steps: current.steps.map(s => s.id === fresh.id ? fresh : s) } : current)
  async function openHistory(id) {
    setError(null)
    try { await onOpenPrevious(id) } catch (err) { setError(err) }
  }
  async function complete() {
    if (readOnly || busy) return
    setBusy(true); setError(null)
    try { await onComplete() } catch (err) { setError(err) } finally { setBusy(false) }
  }
  function choose(id) {
    setTab(id)
    if (window.matchMedia('(max-width:700px)').matches) question.current?.scrollIntoView({ block: 'start', behavior: 'instant' })
  }
  function keyTab(event, index) {
    let next
    if (event.key === 'ArrowRight') next = (index + 1) % TABS.length
    else if (event.key === 'ArrowLeft') next = (index + TABS.length - 1) % TABS.length
    else if (event.key === 'Home') next = 0
    else if (event.key === 'End') next = TABS.length - 1
    else return
    event.preventDefault(); choose(TABS[next][0]); tabs.current[next]?.focus()
  }
  const ticket = first ? <Step key={first.id || first.rule_key} first step={first} final={report.final} readOnly={readOnly} onUpdate={update} /> : <p>Пока нет предложенных шагов.</p>
  return <div className="atlas-report">
    {onReturn && <Button variant="ghost" onClick={onReturn}>← К новому разбору</Button>}
    <header className="atlas-question" ref={question}><p className="eyebrow">{report.final ? 'Итоговый разбор' : 'Черновой разбор'} · {monthLabel(report.as_of)}</p><h1>{report.entry_answer.question}</h1><span className="atlas-precision">{precision[report.precision]}</span></header>
    {readOnly && <p className="atlas-offline" role="status">Офлайн · только чтение{offlineSavedAt && <> · копия сохранена {new Date(offlineSavedAt).toLocaleString('ru-RU')}</>}. Для изменения шагов нужна сеть.</p>}
    <section className={`atlas-answer atlas-answer-${report.entry_answer.verdict}`} aria-label="Главный вывод"><span className="atlas-answer-mark" aria-hidden="true">↗</span><div><span className="atlas-eyebrow">Главное</span><p>{overviewReserveGap ? 'Есть остаток. Не хватает запаса.' : report.entry_answer.text}</p>{overviewReserveGap && incomeLoss?.months_until_negative && <small>Без основного дохода — дефицит с {incomeLoss.months_until_negative}-го месяца.</small>}</div></section>
    <div className="atlas-workspace"><nav className="atlas-tabs" role="tablist" aria-label="Разделы ответа">{TABS.map(([id, label, icon], i) => <button key={id} ref={el => { tabs.current[i] = el }} type="button" role="tab" id={`atlas-tab-${id}`} aria-controls={`atlas-panel-${id}`} aria-selected={tab === id} tabIndex={tab === id ? 0 : -1} onKeyDown={e => keyTab(e, i)} onClick={() => choose(id)}><span className="atlas-nav-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d={PATHS[icon]} /></svg></span><span>{label}</span></button>)}</nav>
      <div className="atlas-surface">
        <section role="tabpanel" id="atlas-panel-answer" aria-labelledby="atlas-tab-answer" hidden={tab !== 'answer'} tabIndex={0}>
          <div className="atlas-metrics"><article><span>Остаётся в месяц</span><strong><Money value={report.free_cashflow} draft={draft} /></strong><small>После расходов и платежей</small></article><article><span>Резерв семьи</span>{outflow > 0 && cushion ? <><strong>{cushion.metrics.months.toFixed(1).replace('.', ',')} <small>из {cushion.metrics.target_months} месяцев</small></strong><small>Цель — {cushion.metrics.target_months} мес. расходов</small><progress value={Math.max(0, Math.min(cushion.metrics.months, cushion.metrics.target_months))} max={cushion.metrics.target_months || 1} aria-label="Резерв относительно цели" /></> : <p>Уточните расходы</p>}</article></div>
          <div className="atlas-action-label"><b>Можно сделать сейчас</b><span>↗ Нажмите, чтобы открыть</span></div>
          {previous && (previous.status === 'unavailable' || previous.steps?.length > 0) ? <PreviousStepBridge key={report.checkup_id} context={previous} onOpen={onOpenPrevious} readOnly={readOnly}>{ticket}</PreviousStepBridge> : ticket}
          {others.length > 0 && <details className="atlas-disclosure"><summary>Остальные шаги · {others.length}</summary>{others.map(s => <Step key={s.id || s.rule_key} step={s} final={report.final} readOnly={readOnly} onUpdate={update} />)}</details>}
          <Insights insights={report.insights} />
          <DecisionValue key={`decision-${checkup.id}`} checkup={checkup} report={report} readOnly={readOnly} onUnauthorized={onUnauthorized} />
          <details className="atlas-disclosure"><summary>Вся картина семьи</summary><p>{report.entry_answer.text}</p><div className="atlas-areas">{report.areas.map(area => <article key={area.key}><h3>{area.title}</h3><Light value={area.light} /><AreaMetrics area={area} draft={draft} /></article>)}</div><p>Капитал семьи: <Money value={report.net_worth} draft={draft} /></p><p className="hint">Точно введено {Math.round((report.precision_share ?? 0) * 100)} % сумм. Оценки можно уточнить.</p></details>
          {report.goals.length > 0 && <details className="atlas-disclosure"><summary>Ваши цели · {report.goals.length}</summary>{report.goals.every(g => g.progress) ? <GoalRoutes goals={report.goals} asOf={report.as_of} available={report.free_cashflow} /> : report.goals.map(g => <article key={g.title}><h3>{g.title}</h3><p>{rub(g.monthly_needed)} в месяц · {g.realistic ? 'успеваете' : g.realistic_month ? `реально: ${monthLabel(g.realistic_month)}` : 'уточните срок'}</p></article>)}</details>}
        </section>
        <section role="tabpanel" id="atlas-panel-forecast" aria-labelledby="atlas-tab-forecast" hidden={tab !== 'forecast'} tabIndex={0}><h2>У денег есть горизонт.</h2><p className="atlas-caption">Остаток на счёте · {report.forecast.base.length} месяцев</p><div className="atlas-metrics">{series.map(s => <article key={s.name}><span>{s.name}</span><strong><Money value={s.points.at(-1)?.liquid} draft={draft} /></strong><small>{s.points.length ? monthLabel(s.points.at(-1).month) : 'Нет данных'}</small></article>)}</div><LineChart series={series} /><Values series={series} /><details className="atlas-disclosure"><summary>На чём основан прогноз</summary><p>Базовый — середины введённых диапазонов. Пессимистичный — доходы и накопления по нижней границе, расходы по верхней. При точных суммах линии совпадают.</p><p>Текущий график платежей, без предлагаемых досрочных взносов. Без инфляции и индексации доходов. Это сценарий, не обещание.</p></details></section>
        <section role="tabpanel" id="atlas-panel-stress" aria-labelledby="atlas-tab-stress" hidden={tab !== 'stress'} tabIndex={0}><h2>А если жизнь изменится?</h2><p className="atlas-caption">Независимые сценарии, не вероятности</p><div className="atlas-scenarios" role="group" aria-label="Стресс-сценарии">{report.scenarios.map((s, i) => <button type="button" key={s.id} aria-pressed={scenario === s} onClick={() => setScenarioIndex(i)}>{s.title}<span aria-hidden="true">{s.verdict === 'ok' ? '↗' : '!'}</span></button>)}</div>{scenario ? <><p className="atlas-caption">{scenario.description}</p><div className={`atlas-scenario-result ${scenario.months_until_negative ? 'risk' : ''}`} role="status"><b>{scenario.months_until_negative ? `Дефицит с ${scenario.months_until_negative}-го месяца` : `Выдерживает ${scenario.series.length} месяцев`}</b><details><summary>Почему такой вывод</summary><p>Минимальный остаток: {rub(scenario.min_liquid)}. Отрицательное значение — нехватка денег внутри сценария, даже если к концу периода остаток положительный.</p></details></div><LineChart domain={stressDomain} series={[{ name: scenario.title, tone: scenario.verdict, points: scenario.series }]} /><Values series={[{ name: scenario.title, points: scenario.series }]} /></> : <p>Нет данных сценариев.</p>}</section>
        <section role="tabpanel" id="atlas-panel-debts" aria-labelledby="atlas-tab-debts" hidden={tab !== 'debts'} tabIndex={0}><h2>Меньше долга. Больше пространства.</h2><p className="atlas-caption">Сравнение стратегий · условия договора проверьте самостоятельно</p><DebtStrategy d={report.debt_strategy} /><details className="atlas-disclosure"><summary>Как сравниваем</summary><p>Альтернативные стратегии добавляют {rub(report.debt_strategy.extra)} в месяц. Освободившиеся платежи переходят на следующий долг. Даты — результат модели по введённым ставкам, не банковский график.</p><p>Этот расчёт отдельно от прогноза «ничего не менять». Деньги автоматически не переводятся.</p></details></section>
        <section role="tabpanel" id="atlas-panel-history" aria-labelledby="atlas-tab-history" hidden={tab !== 'history'} tabIndex={0}>{tab === 'history' && <History readOnly={readOnly} onOpen={openHistory} onDraft={onHistoryDraft} onNew={onNew} onUnauthorized={onUnauthorized} />}</section>
      </div>
    </div>
    <ErrorNote error={error} />
    <div className="atlas-report-controls">{!report.final ? <><Button variant="ghost" disabled={readOnly} onClick={onRefine}>Уточнить данные</Button><Button busy={busy} disabled={readOnly} onClick={complete}>Получить итоговый разбор</Button></> : <Button variant="ghost" disabled={readOnly} onClick={onNew}>Новый чекап</Button>}</div>
    <details className="atlas-footnote"><summary>О расчёте</summary><p>{report.disclaimer}</p><p>Правила v{report.rules_version} · ядро {report.fincore_version}</p></details>
  </div>
}
