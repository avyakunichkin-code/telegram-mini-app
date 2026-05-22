/**
 * Иконки сценария старта — плоский однотонный штрих (как mqx-finance-chip на дашборде).
 * viewBox 24×24, stroke currentColor на градиентной подложке.
 */

function IconFlat({ className, children }) {
  return (
    <svg className={className} viewBox="0 0 24 24" width={24} height={24} aria-hidden fill="none">
      {children}
    </svg>
  );
}

/** Студент — учёба / первый бюджет */
export function IconScenarioStudent({ className = '' }) {
  return (
    <IconFlat className={className}>
      <path d="M12 4 4 8v2l8 4 8-4V8l-8-4z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M6 12v4c0 2.2 2.7 4 6 4s6-1.8 6-4v-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M20 8v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </IconFlat>
  );
}

/** Профессионал — авто */
export function IconScenarioCar({ className = '' }) {
  return (
    <IconFlat className={className}>
      <path
        d="M5 16h14l-1.5-5H6.5L5 16z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="8" cy="16" r="1.5" fill="currentColor" />
      <circle cx="16" cy="16" r="1.5" fill="currentColor" />
      <path d="M14 8h3v3h-3z" stroke="currentColor" strokeWidth="1.75" />
    </IconFlat>
  );
}

/** Руководитель — дом */
export function IconScenarioHome({ className = '' }) {
  return (
    <IconFlat className={className}>
      <path d="M4 12 12 5l8 7v7H4v-7z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M10 19v-5h4v5" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </IconFlat>
  );
}

/** Предприниматель — производство / завод */
export function IconScenarioFactory({ className = '' }) {
  return (
    <IconFlat className={className}>
      <path d="M3 19V11l4-2v2l5-4v10H3z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M13 19V9h8v10h-8z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M16 6V4M18 5h-4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      <path d="M16 13h3M16 16h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </IconFlat>
  );
}

const ICON_BY_KEY = {
  fresh_start: IconScenarioStudent,
  car_loan: IconScenarioCar,
  home_mortgage: IconScenarioHome,
  debt_stack: IconScenarioFactory,
  factory: IconScenarioFactory,
};

export function ScenarioSceneIcon({ iconKey, className = '' }) {
  const C = ICON_BY_KEY[iconKey] || IconScenarioStudent;
  return <C className={className} />;
}
