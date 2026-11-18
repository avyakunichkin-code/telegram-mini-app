import { InvestPositionMetrics } from '../metrics/InvestPositionMetrics';
import { MqxCapitalTextRowAction } from '../primitives/MqxCapitalTextRowAction';
import { MqxFinListRow } from './MqxFinListRow';
import { MqxRowAction } from '../primitives/MqxRowAction';

export function InvestPositionRow({
  position,
  onClose,
  onCloseRequest,
  useTextAction = false,
}) {
  const handleRemove = onCloseRequest ?? onClose;
  const isBond = position.kind === 'bond';
  const actionLabel = isBond ? 'Продать' : 'Закрыть';
  const actionVariant = isBond ? 'sell' : 'close';

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
        useTextAction ? (
          <MqxCapitalTextRowAction
            variant={actionVariant}
            ariaLabel={`${actionLabel} ${position.title}`}
            onClick={handleRemove}
          >
            {actionLabel}
          </MqxCapitalTextRowAction>
        ) : (
          <MqxRowAction
            variant="remove"
            ariaLabel={`Закрыть позицию ${position.title}`}
            onClick={handleRemove}
          />
        )
      }
    />
  );
}
