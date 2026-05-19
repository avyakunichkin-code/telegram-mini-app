import { MoneyText } from '../../MoneyText';
import { MetricInlineItem } from './MetricInlineItem';
import { MetricsRow } from './MetricsRow';

export function AssetTemplateMetrics({ assetValue, monthlyMaintenanceCost, monthlyIncome = 0 }) {
  const showIncome = Number(monthlyIncome) > 0;

  return (
    <MetricsRow>
      <MetricInlineItem tip="Стоимость актива" glyph="coin">
        <MoneyText value={assetValue} decimals={0} />
      </MetricInlineItem>
      <MetricInlineItem tip="Обслуживание за период (списание в конце периода; в модели — ежемесячная сумма)" glyph="down" tone="neg">
        <MoneyText value={monthlyMaintenanceCost} decimals={0} />
      </MetricInlineItem>
      {showIncome ? (
        <MetricInlineItem tip="Доход за период (начисление в конце периода; в модели — ежемесячная сумма)" glyph="up" tone="pos">
          <MoneyText value={monthlyIncome} decimals={0} />
        </MetricInlineItem>
      ) : null}
    </MetricsRow>
  );
}
