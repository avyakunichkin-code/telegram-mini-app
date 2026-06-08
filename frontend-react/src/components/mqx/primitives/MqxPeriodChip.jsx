import { TURN_SINGULAR } from '../../../constants/turnCopy';

/** Чип «Ход» в hero. */
export function MqxPeriodChip({ label = TURN_SINGULAR, value, className = '' }) {
  return (
    <div className={['mqx-period-chip', className].filter(Boolean).join(' ')}>
      <div className="mqx-period-chip__label">{label}</div>
      <div className="mqx-period-chip__value">{value}</div>
    </div>
  );
}
