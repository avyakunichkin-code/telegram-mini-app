import { useState } from 'react'
import { api } from '../api.js'
import { Bars, Button, Card, ErrorNote, Light, LineChart, Money, Precision, Verdict } from '../components.jsx'
import { monthLabel, pct, plural, rub } from '../format.js'

const PRECISION = {
  draft: ['Черновая точность', 'Много ответов диапазонами или оценок — уточните разделы, и разбор станет точнее.'],
  approximate: ['Приблизительная точность', 'Часть цифр примерная. Для итогового разбора стоит уточнить крупные суммы.'],
  refined: ['Уточнённые данные', 'Почти все суммы введены точно.'],
}

/** Главная цифра плитки-ответа — своя для каждого вопроса со входа. */
function heroFor(ea) {
  const n = ea.numbers || {}
  if (n.dti_after !== undefined && n.dti_after !== null) return [Math.round(n.dti_after), ['% дохода', 'уйдёт на платежи']]
  if (n.current?.months) return [n.current.months, [plural(n.current.months, 'месяц', 'месяца', 'месяцев'), 'до закрытия кредитов']]
  if ('months_until_negative' in n) {
    return n.months_until_negative
      ? [n.months_until_negative, [plural(n.months_until_negative, 'месяц', 'месяца', 'месяцев'), 'продержитесь']]
      : ['12+', ['месяцев', 'бюджет выдерживает']]
  }
  if ('green' in n) return [n.green, ['из 4 областей', 'в порядке']]
  return null
}

function AreaMetrics({ area, draft }) {
  const m = area.metrics
  const $ = (v) => <Money value={v} draft={draft} />
  switch (area.key) {
    case 'budget':
      return (
        <dl className="kv">
          <dt>Доход</dt><dd>{$(m.income)}</dd>
          <dt>Расходы и платежи</dt><dd>{$(m.outflow)}</dd>
          <dt>Остаётся</dt><dd>{$(m.free_cashflow)}</dd>
          <dt>Норма сбережений</dt><dd>{m.savings_rate === null ? '—' : pct(m.savings_rate)}</dd>
        </dl>
      )
    case 'debts':
      return (
        <dl className="kv">
          <dt>Платежи от дохода</dt><dd>{m.dti_percent.toFixed(0)} %</dd>
          <dt>Всего долга</dt><dd>{$(m.total_debt)}</dd>
          <dt>Просрочка</dt><dd>{$(m.overdue)}</dd>
        </dl>
      )
    case 'cushion':
      return (
        <dl className="kv">
          <dt>Подушка</dt><dd>{$(m.cushion)}</dd>
          <dt>Хватит на</dt><dd>{m.months.toFixed(1)} мес. из {m.target_months}</dd>
          <dt>Цели</dt><dd>{m.goals_realistic ? 'реалистичны' : 'есть нереалистичные'}</dd>
        </dl>
      )
    default:
      return (
        <>
          <dl className="kv"><dt>Вложения</dt><dd>{$(m.investments)}</dd></dl>
          {area.flags?.length ? (
            <ul className="flags">{area.flags.map((f) => <li key={f.key + f.text}>{f.text}</li>)}</ul>
          ) : (
            <p className="muted">Явных пробелов в защите не видно.</p>
          )}
        </>
      )
  }
}

function Steps({ steps, final, onPatch }) {
  // Жёлтая плитка — первый ещё не сделанный шаг
  const next = steps.find((s) => s.status === 'suggested')
  return (
    <ol className="steps">
      {steps.map((s) => (
        <li key={s.rule_key} className={`step step-${s.status} ${s === next ? 'step-next' : ''}`}>
          <span className="step-rank">{s.rank}</span>
          <div>
            <b>{s.title}</b>
            <p>{s.why}</p>
            {final && s.id && (
              <div className="row gap">
                {s.status !== 'done' ? (
                  <button className="chip" onClick={() => onPatch(s, 'done')}>Сделано</button>
                ) : (
                  <span className="done-note">Сделано</span>
                )}
                {s.status === 'suggested' && <button className="link" onClick={() => onPatch(s, 'dismissed')}>Не подходит</button>}
                {s.status !== 'suggested' && <button className="link" onClick={() => onPatch(s, 'suggested')}>Вернуть</button>}
              </div>
            )}
          </div>
        </li>
      ))}
    </ol>
  )
}

function DebtStrategy({ d }) {
  if (!d.current || d.current.months === 0) return <p className="muted">Кредитов нет.</p>
  const rows = [
    ['current', 'Как сейчас', d.current],
    ['avalanche', `Лавина: +${rub(d.extra)} в месяц на самый дорогой`, d.avalanche],
    ['snowball', `Снежный ком: +${rub(d.extra)} в месяц на самый маленький`, d.snowball],
  ]
  const best = d.avalanche.total_interest <= d.snowball.total_interest ? 'avalanche' : 'snowball'
  return (
    <div className="table-wrap">
      <table className="table">
        <thead><tr><th>Стратегия</th><th>Все кредиты закрыты</th><th className="num">Переплата</th></tr></thead>
        <tbody>
          {rows.map(([key, name, p]) => (
            <tr key={key} className={key === best && p.months ? 'best' : ''}>
              <td>{name}</td>
              <td>{p.months ? `${monthLabel(p.payoff_month)}, через ${p.months} ${plural(p.months, 'месяц', 'месяца', 'месяцев')}` : 'не гасится'}</td>
              <td className="num">{rub(p.total_interest)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function Report({ checkup, report, onRefine, onComplete, onNew, onReport }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [p1, p2] = PRECISION[report.precision]
  const draft = report.precision === 'draft'
  const ea = report.entry_answer
  const hero = heroFor(ea)
  const base = report.forecast.base
  const pessNegative = report.forecast.pessimistic.find((p) => p.liquid < 0)

  async function complete() {
    setBusy(true)
    setError(null)
    try {
      await onComplete()
    } catch (err) {
      setError(err)
    } finally {
      setBusy(false)
    }
  }

  async function patch(step, status) {
    try {
      const fresh = await api.patchStep(step.id, status)
      onReport({ ...report, steps: report.steps.map((s) => (s.id === step.id ? { ...s, ...fresh } : s)) })
    } catch (err) {
      setError(err)
    }
  }

  return (
    <div className="stack report">
      <div className="board">
        <section className={`card tile-inverse report-head answer answer-${ea.verdict} t-full`}>
          <div className="card-head">
            <p className="eyebrow" style={{ margin: 0 }}>{report.final ? 'Итоговый разбор' : 'Черновой разбор'} на {monthLabel(report.as_of)}</p>
            <Verdict value={ea.verdict} />
          </div>
          <h1>{ea.question}</h1>
          {hero && <div className="hero-num"><b>{hero[0]}</b><span>{hero[1][0]}<br />{hero[1][1]}</span></div>}
          <p className="answer-text">{ea.text}</p>
        </section>

        <section className={`card tile-tall t-half ${report.free_cashflow < 0 ? 'area-red' : 'area-green'}`}>
          <h3>Остаётся в месяц</h3>
          <div><div className="stat-value long">{rub(report.free_cashflow, { sign: true })}</div><p className="muted">капитал семьи — {rub(report.net_worth)}</p></div>
        </section>
        <section className="card tile-tall t-half" title={p2}>
          <h3>{p1}</h3>
          <div><div className="stat-value">{Math.round((report.precision_share ?? 0) * 100)} %</div><p className="muted" style={{ marginBottom: 8 }}>сумм введено точно</p><Precision share={report.precision_share} hint={p2} /></div>
        </section>

        <Card title="С чего начать" className="t-full">
          <Steps steps={report.steps} final={report.final} onPatch={patch} />
        </Card>

        {report.areas.map((a) => (
          <Card key={a.key} title={a.title} aside={<Light value={a.light} />} className={`area area-${a.light} t-area`}>
            <AreaMetrics area={a} draft={draft} />
          </Card>
        ))}

        <section className="card tile-inverse t-full">
          <header className="card-head"><h3>Прогноз на 12 месяцев</h3><span className="muted">если ничего не менять</span></header>
          <Bars points={base} label={`Остаток денег по месяцам: от ${rub(base[0]?.liquid)} до ${rub(base[base.length - 1]?.liquid)}`} />
          <div className="bars-axis"><span>{monthLabel(base[0]?.month)}</span><span>{monthLabel(base[base.length - 1]?.month)}: {rub(base[base.length - 1]?.liquid)}</span></div>
          {pessNegative && <p className="bars-warn">В пессимистичном сценарии деньги кончатся в {monthLabel(pessNegative.month)}.</p>}
        </section>

        <h2 className="t-full" style={{ padding: '0 6px' }}>Стресс-тест</h2>
        {report.scenarios.map((s) => (
          <Card key={s.id} title={s.title} aside={<Verdict value={s.verdict} />} className={`scenario scenario-${s.verdict} t-quarter`}>
            <p className="muted">{s.description}</p>
            <LineChart compact height={60} series={[{ name: s.title, tone: s.verdict, points: s.series }]} />
            <p>
              {s.months_until_negative
                ? `Деньги кончатся через ${s.months_until_negative} ${plural(s.months_until_negative, 'месяц', 'месяца', 'месяцев')}.`
                : 'Бюджет выдерживает все 12 месяцев.'}
              {' '}Минимум на счёте — {rub(s.min_liquid)}.
            </p>
          </Card>
        ))}

        <Card title="Кредиты: как закрыть быстрее" className="t-full">
          <DebtStrategy d={report.debt_strategy} />
        </Card>

        {report.goals.length > 0 && (
          <Card title="Цели" className="t-full">
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>Цель</th><th className="num">Нужно в месяц</th><th>Срок</th></tr></thead>
                <tbody>
                  {report.goals.map((g) => (
                    <tr key={g.title}>
                      <td>{g.title}, {rub(g.target_amount)}</td>
                      <td className="num">{rub(g.monthly_needed)}</td>
                      <td>{g.realistic ? `${monthLabel(g.target_month)}, успеваете` : `реально: ${g.realistic_month ? monthLabel(g.realistic_month) : '—'}`}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      <ErrorNote error={error} />
      {!report.final ? (
        <div className="actions sticky">
          <Button variant="ghost" onClick={onRefine}>Уточнить данные</Button>
          <Button busy={busy} onClick={complete}>Получить итоговый разбор</Button>
        </div>
      ) : (
        <div className="actions">
          <Button variant="ghost" onClick={onNew}>Пересчитать позже — новый чекап</Button>
        </div>
      )}
      <p className="disclaimer">{report.disclaimer} Правила v{report.rules_version}, ядро {report.fincore_version}, чекап {checkup.id}.</p>
    </div>
  )
}
