import { useEffect, useRef, useState } from 'react';
import { fitChipValuesIn } from '../../../utils/fitChipValue';
import { MonetkaAvatar } from '../onboarding/MonetkaAvatar';

export const MQ_DASH_FINANCE_MONETKA_KEY = 'mq-dash-finance-monetka-v1';

const MONETKA_COPY = (
  <>
    Смотри <strong>ДОХОДЫ</strong> и <strong>РАСХОДЫ</strong> за период. <strong>БАЛАНС</strong> на карте и{' '}
    <strong>ПОДУШКА</strong> — твой запас на чёрный день. Давай улучшим ✨
  </>
);

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

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        d="M6 6l12 12M18 6 6 18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * Статичный блок «Финансы периода» (L3): chip + Монетка + ссылка в раздел финансов.
 */
function FinanceChip({ card, onFlowsNavigate }) {
  const className = [
    'mqx-finance-chip',
    card.chipAction ? 'mqx-finance-chip--action' : '',
    card.cushionFill ? 'mqx-finance-chip--cushion' : '',
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
        {card.cushionFill ? (
          <CushionFillBar percent={card.cushionFill.percent} tier={card.cushionFill.tier} />
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
        aria-label={`${card.title}: открыть раздел`}
        onClick={() => onFlowsNavigate(card.chipAction)}
      >
        {inner}
      </button>
    );
  }

  return (
    <div className={className} title={card.titleHint}>
      {inner}
    </div>
  );
}

export function MqxFinancePeriodBlock({ financeCards = [], onGoFinance, onFlowsNavigate }) {
  const [monetkaDismissed, setMonetkaDismissed] = useState(null);
  const chipsRef = useRef(null);

  useEffect(() => {
    try {
      setMonetkaDismissed(localStorage.getItem(MQ_DASH_FINANCE_MONETKA_KEY) === '1');
    } catch {
      setMonetkaDismissed(false);
    }
  }, []);

  useEffect(() => {
    const root = chipsRef.current;
    if (!root) return undefined;
    const run = () => fitChipValuesIn(root);
    run();
    const ro = new ResizeObserver(run);
    ro.observe(root);
    return () => ro.disconnect();
  }, [financeCards]);

  const dismissMonetka = () => {
    setMonetkaDismissed(true);
    try {
      localStorage.setItem(MQ_DASH_FINANCE_MONETKA_KEY, '1');
    } catch {
      /* storage unavailable */
    }
  };

  return (
    <section className="mqx-finance-static" aria-label="Финансы периода">
      <h2 className="mqx-finance-static__title">Финансы периода</h2>
      <div ref={chipsRef} className="mqx-finance-static__chips">
        {financeCards.map((c) => (
          <FinanceChip key={c.title} card={c} onFlowsNavigate={onFlowsNavigate} />
        ))}
      </div>

      {monetkaDismissed === false ? (
        <div className="mqx-finance-monetka">
          <button
            type="button"
            className="mqx-finance-monetka__close"
            aria-label="Закрыть подсказку"
            onClick={dismissMonetka}
          >
            <CloseIcon />
          </button>
          <div className="mqx-finance-monetka__inner">
            <MonetkaAvatar size={44} className="mqx-finance-monetka__img" />
            <p className="mqx-finance-monetka__text">{MONETKA_COPY}</p>
          </div>
        </div>
      ) : null}

      {onGoFinance ? (
        <button type="button" className="mqx-dash-link" onClick={onGoFinance}>
          Все финансы →
        </button>
      ) : null}
    </section>
  );
}
