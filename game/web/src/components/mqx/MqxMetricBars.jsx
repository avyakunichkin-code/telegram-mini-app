function pctClamp01(x) {
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(1, x));
}

export function MqxGoalBar({ label, valueNode, fraction, fillClass }) {
  const pct = Math.round(pctClamp01(fraction) * 100);
  return (
    <div className="mqx-analytics-goal-row">
      <div className="mqx-analytics-goal-row__head">
        <span className="mqx-analytics-goal-row__label">{label}</span>
        <span className="mqx-analytics-goal-row__value">{valueNode}</span>
      </div>
      <div className="mqx-analytics-goal-track">
        <div className={`mqx-analytics-goal-fill ${fillClass}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function MqxCashflowBar({ label, amountNode, fraction, fillClass }) {
  const pct = Math.round(pctClamp01(fraction) * 100);
  return (
    <div className="mqx-analytics-cf-row">
      <div className="mqx-analytics-cf-row__head">
        <span className="mqx-analytics-cf-row__label">{label}</span>
        <span className="mqx-analytics-cf-row__amount">{amountNode}</span>
      </div>
      <div className="mqx-analytics-cf-track">
        <div className={`mqx-analytics-cf-fill ${fillClass}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export { pctClamp01 };
