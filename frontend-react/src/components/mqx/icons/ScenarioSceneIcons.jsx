/** Иконки жизненных ситуаций для карточек сценария (SI1 outline). */

export function IconScenarioFreshStart({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 72 72" width={72} height={72} aria-hidden fill="none">
      <circle cx={36} cy={36} r={22} stroke="currentColor" strokeWidth={2.25} opacity={0.35} />
      <path
        d="M36 24v14M30 34h12"
        stroke="currentColor"
        strokeWidth={2.25}
        strokeLinecap="round"
      />
      <circle cx={36} cy={40} r={9} fill="currentColor" opacity={0.18} />
      <path
        d="M24 52c4-6 8-9 12-9s8 3 12 9"
        stroke="currentColor"
        strokeWidth={1.75}
        strokeLinecap="round"
        opacity={0.55}
      />
    </svg>
  );
}

export function IconScenarioCarLoan({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 72 72" width={72} height={72} aria-hidden fill="none">
      <path
        d="M16 44h40l-4-12H20l-4 12z"
        stroke="currentColor"
        strokeWidth={2.25}
        strokeLinejoin="round"
      />
      <circle cx={26} cy={44} r={4} stroke="currentColor" strokeWidth={2} />
      <circle cx={46} cy={44} r={4} stroke="currentColor" strokeWidth={2} />
      <path d="M44 28h8v6h-8z" fill="currentColor" opacity={0.35} />
      <path
        d="M48 20v4M52 22h-8"
        stroke="currentColor"
        strokeWidth={1.75}
        strokeLinecap="round"
        opacity={0.65}
      />
    </svg>
  );
}

export function IconScenarioHomeMortgage({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 72 72" width={72} height={72} aria-hidden fill="none">
      <path d="M18 38 36 22l18 16v14H18V38z" stroke="currentColor" strokeWidth={2.25} strokeLinejoin="round" />
      <rect x={30} y={40} width={12} height={12} rx={1.5} fill="currentColor" opacity={0.3} />
      <path
        d="M44 48h12v8H44z"
        stroke="currentColor"
        strokeWidth={1.75}
        opacity={0.55}
      />
      <path
        d="M22 52h32"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        opacity={0.4}
      />
    </svg>
  );
}

export function IconScenarioDebtStack({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 72 72" width={72} height={72} aria-hidden fill="none">
      <rect x={18} y={20} width={36} height={28} rx={4} stroke="currentColor" strokeWidth={2.25} />
      <path d="M24 30h24M24 38h18" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" opacity={0.55} />
      <rect x={44} y={44} width={14} height={14} rx={3} fill="currentColor" opacity={0.22} />
      <path
        d="M48 50v6M45 53h6"
        stroke="currentColor"
        strokeWidth={1.75}
        strokeLinecap="round"
        opacity={0.7}
      />
      <circle cx={28} cy={48} r={6} stroke="currentColor" strokeWidth={1.75} opacity={0.45} />
    </svg>
  );
}

const ICON_BY_KEY = {
  fresh_start: IconScenarioFreshStart,
  car_loan: IconScenarioCarLoan,
  home_mortgage: IconScenarioHomeMortgage,
  debt_stack: IconScenarioDebtStack,
};

export function ScenarioSceneIcon({ iconKey, className = '' }) {
  const C = ICON_BY_KEY[iconKey] || IconScenarioFreshStart;
  return <C className={className} />;
}
