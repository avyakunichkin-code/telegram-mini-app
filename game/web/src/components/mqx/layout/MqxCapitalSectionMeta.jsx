import { MoneyText } from '../../MoneyText';

function ListCountIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M4 6h16M4 12h16M4 18h10" />
    </svg>
  );
}

/** Meta M7 — сумма в заголовке потоков. */
export function MqxCapitalMetaSum({ value, decimals = 0 }) {
  return (
    <span className="mqx-cap-meta-v7">
      <MoneyText value={value} decimals={decimals} />
    </span>
  );
}

/** Meta M8 — иконка списка + число позиций. */
export function MqxCapitalMetaCount({ count }) {
  const empty = !count;
  return (
    <span className={`mqx-cap-meta-v8${empty ? ' mqx-cap-meta-v8--empty' : ''}`}>
      <ListCountIcon />
      {count}
    </span>
  );
}

/** Meta M5 — tint-бейдж для обязательств. */
export function MqxCapitalMetaLiab({ label }) {
  const empty = !label || label === '0';
  return (
    <span className={`mqx-cap-meta-v5 mqx-cap-meta-v5--liab${empty ? ' mqx-cap-meta-v5--empty' : ''}`}>
      {label}
    </span>
  );
}

export function formatDebtCount(count) {
  const n = Math.max(0, Math.floor(Number(count) || 0));
  if (n === 0) return '0';
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return `${n} долг`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return `${n} долга`;
  return `${n} долгов`;
}
