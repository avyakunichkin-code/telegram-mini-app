import { InvestPositionMetrics } from '../metrics/InvestPositionMetrics';
import { MqxFinListRow } from './MqxFinListRow';
import { MqxRowAction } from '../primitives/MqxRowAction';

export function InvestPositionRow({ position, onClose, onCloseRequest }) {
  const handleRemove = onCloseRequest ?? onClose;

  return (
    <MqxFinListRow
      className="mqx-fin-row--invest-pos"
      title={position.title}
      metrics={
        <InvestPositionMetrics
          principal={position.principal}
          annualRatePercent={position.annual_rate_percent}
          rateTone="pos"
        />
      }
      trailing={
        <MqxRowAction
          variant="remove"
          ariaLabel={`Закрыть позицию ${position.title}`}
          onClick={handleRemove}
        />
      }
    />
  );
}
