import { useMemo } from 'react';

const AXES = [
  ['comfort', 'Комфорт'],
  ['status', 'Статус'],
  ['social', 'Связи'],
  ['health', 'Здоровье'],
];

/** Чипы дельты потребностей (события, treat-self). Показываем только ненулевые оси. */
export function NeedsDeltaChips({ delta, className = '' }) {
  const items = useMemo(() => {
    if (!delta) return [];
    return AXES.map(([key, label]) => {
      const v = Number(delta[key]);
      if (!Number.isFinite(v) || v === 0) return null;
      const sign = v > 0 ? '+' : '−';
      const tone = v > 0 ? 'pos' : 'neg';
      return {
        key,
        label,
        text: `${sign}${Math.abs(Math.round(v))} ${label}`,
        tone,
      };
    }).filter(Boolean);
  }, [delta]);

  if (!items.length) return null;

  return (
    <div className={`mqx-needs-delta-chips ${className}`.trim()} aria-hidden={false}>
      {items.map((it) => (
        <span
          key={it.key}
          className={`mqx-needs-delta-chip mqx-needs-delta-chip--${it.tone}`}
        >
          {it.text}
        </span>
      ))}
    </div>
  );
}
