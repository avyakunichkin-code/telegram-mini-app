/*
 * Квитя ★ PO 2026-11-02 (design-lab/mascots/ink-mascots-round, «Итоги хода»): кассовый чек, оторванный с обеих
 * сторон, — это и есть Квитя. Лицо на верхнем оторванном крае, строчки хода — тело. Цвета — токены темы.
 */

/* Зубцы: 20 штук; края на 1.5 и 338.5 — по центру 3-px боковой рамки тела */
const L = 1.5;
const R = 338.5;

function zig(yValley, yPeak) {
  const step = (R - L) / 20;
  let d = '';
  for (let k = 0; k < 20; k += 1) {
    const x = L + step * k;
    d += `${k === 0 ? 'M' : 'L'}${x.toFixed(2)} ${yValley} L${(x + step / 2).toFixed(2)} ${yPeak} `;
  }
  return `${d}L${R} ${yValley}`;
}

const TOP = zig(16, 8);
const BOTTOM = zig(0, 10);
const TOP_FILL = `${TOP} L${R} 62 L${L} 62 Z`;
const TOP_EDGE = `M${L} 62 L${TOP.slice(1)} L${R} 62`;

/**
 * @param {{ id: string, label: string, value: string, tone?: 'gain'|'loss' }[]} rows — строчки чека
 * @param {{ label: string, value: string }} total — итог за ход, выделен маркером
 * @param {{ label: string, value: string }[]} [footer] — строки под итогом (например, «На счёте»)
 */
export function KvityaReceipt({ rows, total, footer = [] }) {
  return (
    <div className="mqx-kvitya">
      <svg viewBox="0 0 340 62" aria-hidden="true" focusable="false">
        <path className="mqx-kvitya__paper" d={TOP_FILL} />
        <path className="mqx-kvitya__edge" d={TOP_EDGE} />
        <rect className="mqx-kvitya__band" x="145" y="26" width="50" height="7" rx="3.5" />
        <circle className="mqx-kvitya__ink" cx="155" cy="42" r="4.5" />
        <circle className="mqx-kvitya__ink" cx="185" cy="42" r="4.5" />
        <path className="mqx-kvitya__smile" d="M160 52 Q170 58 180 52" />
      </svg>
      <dl className="mqx-kvitya__body" aria-label="Чек хода">
        {rows.map((r) => (
          <div key={r.id} className="mqx-kvitya__row">
            <dt>{r.label}</dt>
            <dd className={r.tone ? `mqx-kvitya__value--${r.tone}` : undefined}>{r.value}</dd>
          </div>
        ))}
        <div className="mqx-kvitya__rule" role="presentation" />
        <div className="mqx-kvitya__row mqx-kvitya__total">
          <dt>{total.label}</dt>
          <dd>{total.value}</dd>
        </div>
        {footer.map((r) => (
          <div key={r.label} className="mqx-kvitya__row mqx-kvitya__foot">
            <dt>{r.label}</dt>
            <dd>{r.value}</dd>
          </div>
        ))}
      </dl>
      <svg viewBox="0 0 340 14" aria-hidden="true" focusable="false">
        <path className="mqx-kvitya__paper" d={`${BOTTOM} Z`} />
        <path className="mqx-kvitya__edge" d={BOTTOM} />
      </svg>
    </div>
  );
}
