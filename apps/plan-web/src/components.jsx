import { useState } from 'react'
import { monthLabel, rub } from './format.js'

export function Button({ variant = 'primary', busy, children, ...props }) {
  return (
    <button className={`btn btn-${variant}`} disabled={busy || props.disabled} {...props}>
      {busy ? 'Секунду…' : children}
    </button>
  )
}

export function ErrorNote({ error }) {
  if (!error) return null
  return <p className="error" role="alert">{error.message || String(error)}</p>
}

export function Card({ title, aside, children, className = '' }) {
  return (
    <section className={`card ${className}`}>
      {(title || aside) && (
        <header className="card-head">
          {title && <h3>{title}</h3>}
          {aside}
        </header>
      )}
      {children}
    </section>
  )
}

export function Light({ value }) {
  const label = { green: 'Хорошо', yellow: 'Внимание', red: 'Риск' }[value] || '—'
  return <span className={`light light-${value}`}>{label}</span>
}

export function Verdict({ value }) {
  const label = { ok: 'Выдержите', edge: 'На грани', fail: 'Не выдержите', unknown: 'Нужны данные' }[value] || value
  return <span className={`verdict verdict-${value}`}>{label}</span>
}

const num = (v) => (v === '' || v === null || v === undefined ? '' : String(v))

/** Сумма точно или «примерно от–до». Значение — { min, max }. */
export function RangeInput({ label, value, onChange, hint }) {
  const v = value || { min: 0, max: 0 }
  const [rangedPick, setRanged] = useState(false)
  // диапазон пришёл снаружи (пресет, сохранённые данные) — показываем «от–до»
  const ranged = rangedPick || Number(v.min) !== Number(v.max)
  const set = (patch) => onChange({ ...v, ...patch })
  return (
    <label className="field">
      <span className="field-label">
        {label}
        <button type="button" className="link" onClick={() => {
          if (ranged) set({ max: v.min })
          setRanged(!ranged)
        }}>
          {ranged ? 'знаю точно' : 'примерно от–до'}
        </button>
      </span>
      {ranged ? (
        <span className="range">
          <input inputMode="numeric" aria-label={`${label}: от`} value={num(v.min)}
            onChange={(e) => set({ min: toNum(e.target.value) })} />
          <span>—</span>
          <input inputMode="numeric" aria-label={`${label}: до`} value={num(v.max)}
            onChange={(e) => set({ max: toNum(e.target.value) })} />
          <span className="unit">₽</span>
        </span>
      ) : (
        <span className="range">
          <input inputMode="numeric" aria-label={label} value={num(v.min)}
            onChange={(e) => { const n = toNum(e.target.value); onChange({ min: n, max: n }) }} />
          <span className="unit">₽</span>
        </span>
      )}
      {hint && <span className="hint">{hint}</span>}
    </label>
  )
}

export function toNum(s) {
  const cleaned = String(s).replace(/\s/g, '').replace(',', '.')
  if (cleaned === '') return ''
  const n = Number(cleaned)
  return Number.isFinite(n) ? n : ''
}

export function Presets({ values, onPick }) {
  return (
    <div className="presets">
      {values.map(([lo, hi]) => (
        <button type="button" key={`${lo}-${hi}`} className="chip" onClick={() => onPick({ min: lo, max: hi })}>
          {hi ? `${short(lo)}–${short(hi)}` : `${short(lo)}+`}
        </button>
      ))}
    </div>
  )
}

function short(n) {
  if (n >= 1_000_000) return `${n / 1_000_000} млн`
  if (n >= 1000) return `${n / 1000} тыс`
  return String(n)
}

/** Линии ликвидности по месяцам. series: [{ name, points: [{month, liquid}], tone }] */
export function LineChart({ series, height = 180, compact = false }) {
  const all = series.flatMap((s) => s.points.map((p) => p.liquid))
  if (!all.length) return null
  const max = Math.max(0, ...all)
  const min = Math.min(0, ...all)
  const span = max - min || 1
  const n = series[0].points.length
  const W = 600
  const H = height
  const pad = compact ? 4 : 28
  const x = (i) => pad + (i * (W - pad * 2)) / Math.max(1, n - 1)
  const y = (v) => pad / 2 + ((max - v) * (H - pad)) / span
  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img"
      aria-label={series.map((s) => `${s.name}: от ${rub(Math.min(...s.points.map((p) => p.liquid)))} до ${rub(Math.max(...s.points.map((p) => p.liquid)))}`).join('; ')}>
      <line x1={pad} x2={W - pad} y1={y(0)} y2={y(0)} className="chart-zero" />
      {series.map((s) => (
        <polyline key={s.name} className={`chart-line tone-${s.tone}`} fill="none"
          points={s.points.map((p, i) => `${x(i)},${y(p.liquid)}`).join(' ')} />
      ))}
      {!compact && (
        <>
          <text x={pad} y={H - 4} className="chart-label">{monthLabel(series[0].points[0].month)}</text>
          <text x={W - pad} y={H - 4} className="chart-label" textAnchor="end">{monthLabel(series[0].points[n - 1].month)}</text>
          <text x={W - pad} y={y(0) - 6} className="chart-label" textAnchor="end">0 ₽</text>
        </>
      )}
    </svg>
  )
}
