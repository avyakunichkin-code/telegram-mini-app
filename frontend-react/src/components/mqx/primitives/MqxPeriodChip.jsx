/** Чип «Период» в hero. */
export function MqxPeriodChip({ label = 'Период', value, className = '' }) {
  return (
    <div className={['mqx-period-chip', className].filter(Boolean).join(' ')}>
      <div className="mqx-period-chip__label">{label}</div>
      <div className="mqx-period-chip__value">{value}</div>
    </div>
  );
}
