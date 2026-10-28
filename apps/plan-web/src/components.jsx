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

// Статус = слово + форма значка (CSS) + цвет: цвет никогда не единственный носитель
export function Light({ value }) {
  const label = { green: 'Хорошо', yellow: 'Внимание', red: 'Риск' }[value] || '—'
  return <span className={`light light-${value}`}>{label}</span>
}

export function Verdict({ value }) {
  const label = { ok: 'Выдержите', edge: 'На грани', fail: 'Не выдержите', unknown: 'Нужны данные' }[value] || value
  return <span className={`verdict verdict-${value}`}>{label}</span>
}

/** Шкала из трёх делений под заголовком области: уровень читается и без цвета. */
export function AreaMeter() {
  return <span className="area-meter" aria-hidden><i /><i /><i /></span>
}

/**
 * Сумма карандашом или чернилами. Черновая (из вилок) — карандаш и «≈»;
 * inking — момент уточнения: чернила проходят поверх карандаша.
 */
export function Money({ value, draft, inking, sign }) {
  const text = rub(value, { sign })
  if (inking) return <span className="pencil inking" data-v={text}>{text}</span>
  if (draft) return <span className="pencil">≈&nbsp;{text}</span>
  return <span className="ink">{text}</span>
}

/** Точность разбора: какая часть сумм уже обведена чернилами. */
export function Precision({ label, share, hint }) {
  const pctShare = Math.round((share ?? 0) * 100)
  return (
    <div className="precision" title={hint}>
      <span className="precision-label">{label}<span>{pctShare} % ручкой</span></span>
      <span className="precision-line" aria-hidden><i style={{ width: `${pctShare}%` }} /></span>
    </div>
  )
}

/** Линейка запаса: один «сантиметр» — один месяц, красная риска — цель. */
export function Ruler({ months, target, draft, length = 6 }) {
  const at = (m) => `${(Math.min(m, length) / length) * 100}%`
  return (
    <div className="ruler" role="img" aria-label={`Подушки хватит на ${months.toFixed(1)} мес. при цели ${target} мес.`}>
      <div className="ruler-body">
        <div className="ruler-nums" aria-hidden>{Array.from({ length }, (_, i) => <span key={i}>{i}</span>)}</div>
        <span className={`ruler-fill ${draft ? 'draft' : ''}`} style={{ width: at(months) }} />
        <span className="ruler-target" style={{ left: at(target) }}><b>цель {target} мес.</b></span>
      </div>
    </div>
  )
}

const num = (v) => (v === '' || v === null || v === undefined ? '' : String(v))

/** Вилка в клетках: отрезок от min до max, штриховка карандашом, база — крестик ручкой. */
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
        <button type="button" className="link" onClick={() => {
          if (ranged) set({ max: v.min })
          setRanged(!ranged)
        }}>
          {ranged ? 'знаю точно' : 'примерно от–до'}
        </button>
      </span>
      {ranged ? (
        <>
          <span className="range ranged">
            <input inputMode="numeric" aria-label={`${label}: от`} value={num(v.min)}
              onChange={(e) => set({ min: toNum(e.target.value) })} />
            <span>—</span>
            <input inputMode="numeric" aria-label={`${label}: до`} value={num(v.max)}
              onChange={(e) => set({ max: toNum(e.target.value) })} />
            <span className="unit">₽</span>
          </span>
          <Fork min={v.min} max={v.max} />
        </>
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

/**
 * Линии ликвидности по месяцам на клетке. series: [{ name, points: [{month, liquid}], tone }].
 * Ноль — красная линия полей; где последняя серия уходит под ноль — кружок и пометка от руки.
 */
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
