import { MoneyText } from '../../MoneyText';
import { MetricInlineItem } from '../metrics/MetricInlineItem';
import { MetricsRow } from '../metrics/MetricsRow';

function impactTone(kind, delta) {
  const n = Number(delta) || 0;
  if (kind === 'burn') return n > 0 ? 'neg' : n < 0 ? 'pos' : undefined;
  if (kind === 'cash' || kind === 'safety' || kind === 'insurance_payout') {
    return n > 0 ? 'pos' : n < 0 ? 'neg' : undefined;
  }
  return undefined;
}

function impactGlyph(kind) {
  if (kind === 'burn') return 'down';
  if (kind === 'insurance_payout') return 'up';
  if (kind === 'term') return 'term';
  if (kind === 'coin') return 'coin';
  return 'coin';
}

function formatImpactValue(imp) {
  const delta = Number(imp?.delta) || 0;
  const sign = delta > 0 ? '+' : '';
  return (
    <>
      {sign}
      <MoneyText value={delta} decimals={0} />
    </>
  );
}

/** Метрики последствий выбора (как у активов / долгов / страховок). */
export function EventChoiceImpacts({ impacts }) {
  if (!impacts?.length) return null;

  return (
    <MetricsRow className="mqx-events-choice__metrics">
      {impacts.map((imp, idx) => {
        const kind = imp?.kind || 'cash';
        const delta = Number(imp?.delta) || 0;
        const tip = imp?.tip || '';
        return (
          <MetricInlineItem
            key={`${kind}-${idx}`}
            tip={tip}
            glyph={impactGlyph(kind)}
            tone={impactTone(kind, delta)}
          >
            {formatImpactValue(imp)}
          </MetricInlineItem>
        );
      })}
    </MetricsRow>
  );
}
