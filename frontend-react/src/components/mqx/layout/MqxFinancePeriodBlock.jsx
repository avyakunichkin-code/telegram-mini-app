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
export function MqxFinancePeriodBlock({ financeCards = [], onGoFinance }) {
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
          <div key={c.title} className="mqx-finance-chip" title={c.titleHint}>
            <div
              className={[
                'mqx-finance-chip__icon',
                c.accent,
                c.expenseIcon ? 'mqx-accent--expense' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              aria-hidden
            >
              {c.icon}
            </div>
            <div className="mqx-finance-chip__body">
              <div className="mqx-finance-chip__label">{c.title}</div>
              <div
                className={[
                  'mqx-finance-chip__value',
                  c.valueTone ? `mqx-finance-chip__value--${c.valueTone}` : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                {c.valueNode}
              </div>
            </div>
          </div>
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
