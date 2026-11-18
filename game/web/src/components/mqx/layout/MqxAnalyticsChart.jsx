const format = new Intl.NumberFormat('ru-RU');
const rubles = (value) => `${format.format(Math.round(value))} ₽`;
const compact = new Intl.NumberFormat('ru-RU', { notation: 'compact', maximumFractionDigits: 1 });
const compactRubles = (value) => `${compact.format(value)} ₽`;
const calloutAmount = (value) => Math.abs(value) >= 100_000_000 ? compactRubles(value) : rubles(value);

export function MqxAnalyticsChart({ turn, total, delta, history }) {
  const closed = history.filter((point) => !point.is_projection && point.period_index < turn).slice(-3);
  const past = closed.length;
  const turns = [...closed.map((point) => point.period_index), turn, turn + 1, turn + 2, turn + 3];
  const values = [
    ...closed.map((point) => Number(point.cash_balance) + Number(point.safety_fund_balance)),
    total, total + delta, total + 2 * delta, total + 3 * delta,
  ];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const rawStep = Math.max(10000, (max - min) / 4);
  const magnitude = 10 ** Math.floor(Math.log10(rawStep));
  const step = [1, 2, 5, 10].find((factor) => factor * magnitude >= rawStep) * magnitude;
  const bottom = Math.floor(min / step) * step;
  const top = Math.max(bottom + step, Math.ceil(max / step) * step);
  const ticks = Array.from({ length: (top - bottom) / step + 1 }, (_, index) => top - index * step);
  const y = (value) => 164 - (value - bottom) / (top - bottom) * 136;
  const points = values.map((value, index) => [76 + index * 278 / (values.length - 1), y(value)]);
  const actual = points.slice(0, past + 1);
  const forecast = points.slice(past);
  const last = points.length - 1;

  function series(coordinates, projected) {
    const line = coordinates.map((point) => point.join(',')).join(' ');
    return <g className={projected ? 'analytics-projection' : 'analytics-history'}>
      <polygon points={`${coordinates[0][0]},164 ${line} ${coordinates.at(-1)[0]},164`} />
      <polyline points={line} />
    </g>;
  }

  function callout(index, label, kind, lift) {
    const [x, pointY] = points[index];
    const width = Math.max(80, label.length * 8 + 10);
    const left = Math.max(68, Math.min(x - width / 2, 366 - width));
    const topY = Math.max(0, pointY - lift);
    return <g className={`analytics-callout analytics-callout--${kind}`}>
      <title>{rubles(values[index])}</title>
      <path d={`M ${Math.max(left + 8, x - 5)} ${topY + 19} H ${Math.min(left + width - 5, x + 7)} L ${x} ${pointY - 6} Z`} />
      <rect x={left} y={topY} width={width} height="21" rx="9" />
      <text x={left + width / 2} y={topY + 14} textAnchor="middle">{label}</text>
    </g>;
  }

  return <figure className="analytics-preview-chart">
    <svg viewBox="0 0 368 188" role="img" aria-label={`Счёт и подушка. ${turns.map((index, i) => `${i > past ? 'Прогноз, ход' : 'Ход'} ${index}: ${rubles(values[i])}`).join('. ')}.`}>
      {ticks.map((value) => <g key={value}>
        <line className="analytics-grid" x1="67" x2="368" y1={y(value)} y2={y(value)} />
        <text x="0" y={y(value) + 4}>{Math.abs(value) >= 1_000_000 ? compactRubles(value) : rubles(value)}</text>
      </g>)}
      {series(actual, false)}
      {series(forecast, true)}
      <path className="analytics-axis" d="M67 28 V164 H368" />
      {points.map(([x, pointY], index) => <g key={index}>
        <line className="analytics-axis" x1={x} x2={x} y1="164" y2="169" />
        <circle className={index > past ? 'analytics-projection' : 'analytics-history'} cx={x} cy={pointY} r="4.3">
          <title>{rubles(values[index])}</title>
        </circle>
        <text textAnchor="middle" x={x} y="183">Ход {String(turns[index]).padStart(2, '0')}</text>
      </g>)}
      {past > 1 && callout(0, calloutAmount(values[0]), 'start', 53)}
      {callout(past, calloutAmount(total), 'current', 43)}
      {callout(last, `≈${calloutAmount(values[last])}`, 'forecast', 34)}
    </svg>
    <figcaption>
      <span className="analytics-history">Факт</span>
      <span className="analytics-projection">Если доходы и расходы сохранятся</span>
    </figcaption>
  </figure>;
}

