import { useEffect, useRef } from 'react';
import { fitChipValuesIn } from '../../../utils/fitChipValue';

function CushionFillBar({ percent, tier }) {
  return (
    <div
      className="mqx-cushion-fill"
      role="progressbar"
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Наполнение подушки ${percent}%`}
    >
      <span
        className="mqx-cushion-fill__bar"
        style={{ width: `${percent}%` }}
        data-tier={tier}
      />
    </div>
  );
}

function chipAriaLabel(card, onFlowsNavigate) {
  const valuePart = card.valueLabel ? `, ${card.valueLabel}` : '';
  const actionPart = card.chipAction && onFlowsNavigate ? ', открыть раздел' : '';
  return `${card.title}${valuePart}${actionPart}`;
}

/** Статичный блок «Финансы периода» (L3): 2×2 chips + ссылка в раздел финансов. */
function FinanceChip({ card, onFlowsNavigate }) {
  const className = [
    'mqx-finance-chip',
    card.chipAction ? 'mqx-finance-chip--action' : '',
    card.cushionChip ? 'mqx-finance-chip--cushion' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const inner = (
    <>
      <div
        className={[
          'mqx-finance-chip__icon',
          card.accent,
          card.expenseIcon ? 'mqx-accent--expense' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        aria-hidden
      >
        {card.icon}
      </div>
      <div className="mqx-finance-chip__body">
        <div className="mqx-finance-chip__label">{card.title}</div>
        <div
          className={[
            'mqx-finance-chip__value',
            card.valueTone ? `mqx-finance-chip__value--${card.valueTone}` : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          {card.valueNode}
        </div>
        {card.cushionChip ? (
          <CushionFillBar
            percent={card.cushionFill?.percent ?? 0}
            tier={card.cushionFill?.tier ?? 'low'}
          />
        ) : null}
      </div>
    </>
  );

  if (card.chipAction && onFlowsNavigate) {
    return (
      <button
        type="button"
        className={className}
        title={card.titleHint}
        aria-label={chipAriaLabel(card, onFlowsNavigate)}
        onClick={() => onFlowsNavigate(card.chipAction)}
      >
        {inner}
      </button>
    );
  }

  return (
    <div className={className} title={card.titleHint} aria-label={chipAriaLabel(card, onFlowsNavigate)}>
      {inner}
    </div>
  );
}

export function MqxFinancePeriodBlock({ financeCards = [], onGoFinance, onFlowsNavigate }) {
  const chipsRef = useRef(null);

  useEffect(() => {
    const root = chipsRef.current;
    if (!root) return undefined;
    const run = () => fitChipValuesIn(root);
    run();
    const ro = new ResizeObserver(run);
    ro.observe(root);
    return () => ro.disconnect();
  }, [financeCards]);

  return (
    <section className="mqx-finance-static" aria-label="Финансы периода">
      <h2 className="mqx-finance-static__title">Финансы периода</h2>
      <div ref={chipsRef} className="mqx-finance-static__chips">
        {financeCards.map((c) => (
          <FinanceChip key={c.title} card={c} onFlowsNavigate={onFlowsNavigate} />
        ))}
      </div>

      {onGoFinance ? (
        <button type="button" className="mqx-dash-link" onClick={onGoFinance}>
          Все финансы →
        </button>
      ) : null}
    </section>
  );
}
