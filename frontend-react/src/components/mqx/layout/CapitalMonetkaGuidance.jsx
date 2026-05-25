import { useEffect, useState } from 'react';
import { MonetkaAvatar } from '../onboarding/MonetkaAvatar';

export const MQ_CAPITAL_MONETKA_KEY = 'mq-capital-monetka-v1';

const CAPITAL_MONETKA_COPY = (
  <>
    Здесь разберись с <strong>ДОХОДАМИ</strong> и <strong>РАСХОДАМИ</strong> за период — из чего складывается поток.
    Ниже, в разделах, можно <strong>добавлять</strong> и <strong>удалять</strong> инвестиции, страховки, имущество и
    обязательства.
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

/** Подсказка Монетки на странице капитала (как на дашборде, закрывается крестиком). */
export function CapitalMonetkaGuidance() {
  const [dismissed, setDismissed] = useState(null);

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(MQ_CAPITAL_MONETKA_KEY) === '1');
    } catch {
      setDismissed(false);
    }
  }, []);

  const dismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(MQ_CAPITAL_MONETKA_KEY, '1');
    } catch {
      /* storage unavailable */
    }
  };

  if (dismissed !== false) return null;

  return (
    <div className="mqx-capital-monetka" role="note" aria-label="Подсказка по управлению капиталом">
      <button type="button" className="mqx-capital-monetka__close" aria-label="Закрыть подсказку" onClick={dismiss}>
        <CloseIcon />
      </button>
      <div className="mqx-capital-monetka__inner">
        <MonetkaAvatar size={44} className="mqx-capital-monetka__img" />
        <div className="mqx-capital-monetka__bubble">
          <h3 className="mqx-capital-monetka__title">Что здесь можно сделать</h3>
          <p className="mqx-capital-monetka__text">{CAPITAL_MONETKA_COPY}</p>
        </div>
      </div>
    </div>
  );
}
