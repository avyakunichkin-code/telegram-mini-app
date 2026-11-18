import { Money } from '../components.jsx'
import { monthLabel, pct, plural, rub } from '../format.js'

export function AreaMetrics({ area, draft }) {
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
          <dt>Цели</dt><dd>{m.goals_realistic == null ? 'нужно уточнить срок' : m.goals_realistic ? 'реалистичны' : 'есть нереалистичные'}</dd>
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

export function DebtStrategy({ d }) {
  if (!d?.current || d.current.months === 0) return <p className="muted">Кредитов нет.</p>
  const rows = [['current', 'Как сейчас', 'Только обязательные платежи'], ['avalanche', 'Лавина', 'Сначала самый дорогой долг'], ['snowball', 'Снежный ком', 'Сначала самый маленький долг']]
  return <div className="atlas-strategies">{rows.map(([key, title, caption]) => <article className={key === 'avalanche' ? 'accent' : ''} key={key}><p className="eyebrow">{key === 'current' ? 'Текущий график' : '+' + rub(d.extra) + '/мес.'}</p><h3>{title}</h3><p>{caption}</p><strong>{d[key]?.months ?? '—'} <small>месяцев</small></strong><dl><div><dt>Закрытие по модели</dt><dd>{d[key]?.months ? monthLabel(d[key].payoff_month) : 'Не гасится в срок модели'}</dd></div><div><dt>Проценты за весь срок</dt><dd>{rub(d[key]?.total_interest)}</dd></div></dl><details><summary>Порядок погашения</summary><ol>{(d[key]?.order || []).map(name => <li key={name}>{name}</li>)}</ol></details></article>)}</div>
}
