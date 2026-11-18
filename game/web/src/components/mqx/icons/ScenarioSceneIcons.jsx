/**
 * Иконки сценария старта.
 * Студент/дом — контур; авто/завод — простые силуэты (читаемы на 26–28px).
 */

function IconStroke({ className, children }) {
  return (
    <svg
      className={['mqx-scenario-strip__icon', className].filter(Boolean).join(' ')}
      viewBox="0 0 24 24"
      aria-hidden
      fill="none"
    >
      {children}
    </svg>
  );
}

function IconSilhouette({ className, children }) {
  return (
    <svg
      className={['mqx-scenario-strip__icon', 'mqx-scenario-strip__icon--silhouette', className]
        .filter(Boolean)
        .join(' ')}
      viewBox="0 0 24 24"
      aria-hidden
      fill="currentColor"
    >
      {children}
    </svg>
  );
}

/** Студент */
export function IconScenarioStudent({ className = '' }) {
  return (
    <IconStroke className={className}>
      <path d="M12 4 4 8v2l8 4 8-4V8l-8-4z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M6 12v4c0 2.2 2.7 4 6 4s6-1.8 6-4v-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M20 8v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </IconStroke>
  );
}

/** Профессионал — авто (сбоку: кузов + два колеса) */
export function IconScenarioCar({ className = '' }) {
  return (
    <IconSilhouette className={className}>
      <path d="M7 16.25V12.8l2.4-2.1h5.2l2.4 2.1v3.45H7z" />
      <circle cx="8.25" cy="17.1" r="2" />
      <circle cx="15.75" cy="17.1" r="2" />
    </IconSilhouette>
  );
}

/** Руководитель — дом */
export function IconScenarioHome({ className = '' }) {
  return (
    <IconStroke className={className}>
      <path d="M4 12 12 5l8 7v7H4v-7z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M10 19v-5h4v5" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </IconStroke>
  );
}

/** Предприниматель — завод (зубчатый цех + труба + дым) */
export function IconScenarioFactory({ className = '' }) {
  return (
    <IconSilhouette className={className}>
      <path d="M2.5 19.25V14.5l1.6-1.35 1.6 1.35 1.6-1.35 1.6 1.35 1.6-1.35 1.6 1.35V19.25H2.5z" />
      <path d="M13.75 19.25V10h5.25v9.25H13.75z" />
      <circle cx="16.35" cy="7.35" r="2.15" />
    </IconSilhouette>
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
