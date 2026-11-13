import { forwardRef, useLayoutEffect, useRef, useState } from 'react'
import { ButtonBase } from '@tvoy/ui-kit'
import { monthLabel, rub } from './format.js'
import { groupDigits, parseMoney } from './quick.js'

export const Button = forwardRef(function Button({ variant = 'primary', busy, children, className = '', ...props }, ref) {
  return (
    <ButtonBase {...props} ref={ref} className={`btn btn-${variant}${className ? ` ${className}` : ''}`} busy={busy}>
      {busy ? 'Секунду…' : children}
    </ButtonBase>
  )
})

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

// Статус = слово + форма значка (CSS) + цвет: цвет никогда не единственный носитель
export function Light({ value }) {
  const label = { green: 'Хорошо', yellow: 'Внимание', red: 'Риск' }[value] || '—'
  return <span className={`light light-${value}`}>{label}</span>
}

export function Verdict({ value }) {
  const label = { ok: 'Выдержите', edge: 'На грани', fail: 'Не выдержите', unknown: 'Нужны данные' }[value] || value
  return <span className={`verdict verdict-${value}`}>{label}</span>
}

/** Сумма; черновая (посчитана из вилок) — со знаком «≈». */
export function Money({ value, draft, sign }) {
  const text = rub(value, { sign })
  return draft ? <span>≈&nbsp;{text}</span> : <span>{text}</span>
}

/** Точность разбора: десять делений, закрашено — доля сумм, введённых точно. */
export function Precision({ share, hint }) {
  const on = Math.round((share ?? 0) * 10)
  return (
    <span className="precision" title={hint} role="img" aria-label={`Точно введено ${Math.round((share ?? 0) * 100)} % сумм`}>
      {Array.from({ length: 10 }, (_, i) => <i key={i} className={i < on ? 'on' : ''} />)}
    </span>
  )
}

/** Прогноз столбиками: остаток на конец каждого месяца, последний подсвечен. points: [{month, liquid}] */
export function Bars({ points, label }) {
  if (!points?.length) return null
  const max = Math.max(1, ...points.map((p) => Math.abs(p.liquid)))
  return (
    <div className="bars" role="img" aria-label={label}>
      {points.map((p, i) => (
        <i key={p.month} className={p.liquid < 0 ? 'neg' : i === points.length - 1 ? 'now' : ''}
          style={{ height: `${Math.max(4, (Math.abs(p.liquid) / max) * 100)}%` }} />
      ))}
    </div>
  )
}

/** Поле суммы с разрядами: курсор остаётся после той же цифры, что и до форматирования. */
function MoneyField({ value, onValue, ...props }) {
  const input = useRef(null)
  const digitsBeforeCaret = useRef(null)
  useLayoutEffect(() => {
    if (digitsBeforeCaret.current === null) return
    const el = input.current
    let pos = 0
    for (let seen = 0; pos < el.value.length && seen < digitsBeforeCaret.current; pos++) {
      if (/\d/.test(el.value[pos])) seen++
    }
    el.setSelectionRange(pos, pos)
    digitsBeforeCaret.current = null
  })
  return (
    <input {...props} ref={input} inputMode="numeric" placeholder="0" autoComplete="off" value={groupDigits(value)}
      onChange={(e) => {
        digitsBeforeCaret.current = e.target.value.slice(0, e.target.selectionStart).replace(/\D/g, '').length
        onValue(parseMoney(e.target.value))
      }} />
  )
}

/** Вилка «от–до»: жёлтый отрезок на дорожке, риска — база (середина). */
function Fork({ min, max }) {
  const lo = Number(min) || 0
  const hi = Number(max) || 0
  if (!(hi > lo)) return null
  const scale = hi * 1.5
  const at = (v) => `${(v / scale) * 100}%`
  return (
    <span className="fork" aria-hidden>
      <span className="fork-track">
        <span className="fork-band" style={{ left: at(lo), width: `${((hi - lo) / scale) * 100}%` }} />
        <span className="fork-base" style={{ left: at((lo + hi) / 2) }} />
      </span>
      <span className="fork-ends"><span>0</span><span>база {rub((lo + hi) / 2)}</span><span>{rub(scale)}</span></span>
    </span>
  )
}

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
        <button type="button" className="link"
          aria-label={`${ranged ? 'знаю точно' : 'примерно от–до'}: ${label}`} onClick={() => {
          if (ranged) set({ max: v.min })
          setRanged(!ranged)
        }}>
          {ranged ? 'знаю точно' : 'примерно от–до'}
        </button>
      </span>
      {ranged ? (
        <>
          <span className="range ranged">
            <MoneyField aria-label={`${label}: от`} value={v.min} onValue={(min) => set({ min })} />
            <span>—</span>
            <MoneyField aria-label={`${label}: до`} value={v.max} onValue={(max) => set({ max })} />
            <span className="unit">₽</span>
          </span>
          <Fork min={v.min} max={v.max} />
        </>
      ) : (
        <span className="range">
          <MoneyField aria-label={label} value={v.min} onValue={(n) => onChange({ min: n, max: n })} />
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

export function Presets({ values, value, onPick }) {
  return (
    <div className="presets">
      {values.map(([lo, hi]) => {
        const picked = Number(value?.min) === lo && Number(value?.max) === hi
        return (
          <button type="button" key={`${lo}-${hi}`} className={`chip ${picked ? 'on' : ''}`} aria-pressed={picked} onClick={() => onPick({ min: lo, max: hi })}>
            {hi ? `${short(lo)}–${short(hi)}` : `${short(lo)}+`}
          </button>
        )
      })}
    </div>
  )
}

function short(n) {
  if (n >= 1_000_000) return `${n / 1_000_000} млн`
  if (n >= 1000) return `${n / 1000} тыс`
  return String(n)
}

/**
 * Линии ликвидности по месяцам на клетке. series: [{ name, points: [{month, liquid}], tone }].
 * Ноль — красная линия полей; где последняя серия уходит под ноль — кружок и пометка от руки.
 */
export function LineChart({ series, height = 180, compact = false, domain }) {
  const all = series.flatMap((s) => s.points.map((p) => p.liquid))
  if (!all.length) return null
  const max = domain?.[1] ?? Math.max(0, ...all)
  const min = domain?.[0] ?? Math.min(0, ...all)
  const span = max - min || 1
  const n = series[0].points.length
  const W = 600
  const H = height
  const pad = compact ? 4 : 28
  const x = (i) => pad + (i * (W - pad * 2)) / Math.max(1, n - 1)
  const y = (v) => pad / 2 + ((max - v) * (H - pad)) / span
  const line = (s) => s.points.map((p, i) => `${x(i)},${y(p.liquid)}`).join(' ')

  // Коридор между двумя сериями — та же вилка, растянутая во времени
  const [a, b] = series
  const band = !compact && b && b.points.length === n
    ? `${line(a)} ${b.points.map((p, i) => `${x(i)},${y(p.liquid)}`).reverse().join(' ')}`
    : null

  // Первый месяц, где последняя серия опускается ниже нуля (линейная интерполяция)
  const last = series[series.length - 1].points
  let hitX = null
  for (let i = 1; i < last.length; i++) {
    const p0 = last[i - 1].liquid
    const p1 = last[i].liquid
    if (p0 >= 0 && p1 < 0) {
      hitX = x(i - 1) + ((x(i) - x(i - 1)) * p0) / (p0 - p1)
      break
    }
  }
  const cells = compact ? [] : Array.from({ length: Math.floor(H / 24) }, (_, i) => (i + 1) * 24).filter((v) => v < H)

  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H + (compact ? 0 : 28)}`} role="img"
      aria-label={series.map((s) => `${s.name}: от ${rub(Math.min(...s.points.map((p) => p.liquid)))} до ${rub(Math.max(...s.points.map((p) => p.liquid)))}`).join('; ')}>
      {cells.map((cy) => <line key={cy} x1={0} x2={W} y1={cy} y2={cy} className="chart-cell" />)}
      {band && <polygon className="chart-band" points={band} />}
      {!compact && <rect className="chart-neg" x={0} y={y(0)} width={W} height={Math.max(0, H - y(0))} />}
      <line x1={0} x2={W} y1={y(0)} y2={y(0)} className="chart-zero" />
      {series.map((s) => (
        <polyline key={s.name} className={`chart-line tone-${s.tone}`} points={line(s)} />
      ))}
      {hitX !== null && <circle className="chart-hit" cx={hitX} cy={y(0)} r={compact ? 4 : 6} />}
      {!compact && (
        <>
          {hitX !== null && (
            <text x={Math.min(hitX + 10, W - 190)} y={Math.min(y(0) + 30, H + 4)} className="chart-note">тут кончатся деньги</text>
          )}
          <text x={pad} y={H + 22} className="chart-label">{monthLabel(series[0].points[0].month)}</text>
          <text x={W - pad} y={H + 22} className="chart-label" textAnchor="end">{monthLabel(series[0].points[n - 1].month)}</text>
          <text x={2} y={y(0) - 6} className="chart-label">0 ₽</text>
        </>
      )}
    </svg>
  )
}
