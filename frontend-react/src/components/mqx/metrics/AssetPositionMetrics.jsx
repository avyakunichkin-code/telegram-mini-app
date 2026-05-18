import { MoneyText } from '../../MoneyText';
import { MetricInlineItem } from './MetricInlineItem';
import { MetricsRow } from './MetricsRow';

export function AssetPositionMetrics({ assetValue, monthlyMaintenanceCost, monthlyIncome = 0 }) {
  const showIncome = Number(monthlyIncome) > 0;

  return (
    <MetricsRow className="mqx-asset-metrics-inline--position">
      <MetricInlineItem tip="Стоимость" glyph="coin">
        <MoneyText value={assetValue} decimals={0} />
      </MetricInlineItem>
      <MetricInlineItem tip="Обслуживание / мес" glyph="down" tone="neg">
        <MoneyText value={monthlyMaintenanceCost} decimals={0} />
      </MetricInlineItem>
      {showIncome ? (
        <MetricInlineItem tip="Доход / мес" glyph="up" tone="pos">
          <MoneyText value={monthlyIncome} decimals={0} />
        </MetricInlineItem>
      ) : null}
    </MetricsRow>
  );
}
