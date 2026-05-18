import { InvestPositionMetrics } from '../metrics/InvestPositionMetrics';

export function InvestPositionRow({ position, onClose }) {
  return (
    <div className="mqx-fin-row mqx-fin-row--positions mqx-fin-row--invest-pos">
      <div className="mqx-fin-row__l">
        <div className="mqx-fin-row__title">{position.title}</div>
        <InvestPositionMetrics
          principal={position.principal}
          annualRatePercent={position.annual_rate_percent}
          rateTone="pos"
        />
      </div>
      <div className="mqx-fin-row__r">
        <button
          type="button"
          className="mqx-fin-icon-btn mqx-fin-icon-btn--minus"
          aria-label="Закрыть позицию"
          onClick={onClose}
        >
          −
        </button>
      </div>
    </div>
  );
}
