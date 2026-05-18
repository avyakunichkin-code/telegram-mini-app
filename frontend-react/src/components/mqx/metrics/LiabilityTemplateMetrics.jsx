import { MoneyText } from '../../MoneyText';
import { MetricInlineItem } from './MetricInlineItem';
import { MetricsRow } from './MetricsRow';

export function LiabilityTemplateMetrics({ totalDebt, monthlyPayment, annualRatePercent }) {
  return (
    <MetricsRow>
      <MetricInlineItem tip="Сумма долга" glyph="coin">
        <MoneyText value={totalDebt} decimals={0} />
      </MetricInlineItem>
      <MetricInlineItem tip="Платёж в месяц" glyph="down" tone="neg">
        <MoneyText value={monthlyPayment} decimals={0} />
      </MetricInlineItem>
      <MetricInlineItem tip="Ставка годовых (платим %)" glyph="percent" tone="neg">
        {Number(annualRatePercent)}%
      </MetricInlineItem>
    </MetricsRow>
  );
}
