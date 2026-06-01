/**
 * I-Scene — SVG-иллюстрации (архив: design-lab/game-templates/scenario-icons).
 * Prod-канон: PersonaPortrait (persona-portraits-round). Используется при usePersonaPortraits={false}.
 */

function SceneOrbit({ opacity = 0.28 }) {
  return (
    <path
      d="M22 26Q36 14 50 26Q58 36 50 48Q36 58 22 48Q14 36 22 26"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeDasharray="3.5 3"
      opacity={opacity}
    />
  );
}

function IllusSvg({ className = '', children }) {
  return (
    <svg
      className={['mqx-scenario-illus', className].filter(Boolean).join(' ')}
      viewBox="0 0 72 72"
      width={40}
      height={40}
      aria-hidden
      fill="none"
    >
      {children}
    </svg>
  );
}

/** Студент — учебник, звезда-новичок, шапочка */
export function IllustrationScenarioStudent({ className = '' }) {
  return (
    <IllusSvg className={className}>
      <SceneOrbit />
      <circle cx={24} cy={28} r={11} fill="currentColor" opacity={0.12} />
      <path d="M17 24h6v14h-6V24z" stroke="currentColor" strokeWidth={1.75} strokeLinejoin="round" />
      <path d="M25 24h6v14h-6V24z" stroke="currentColor" strokeWidth={1.75} strokeLinejoin="round" />
      <path d="M23 24v14" stroke="currentColor" strokeWidth={1.5} />
      <path d="M19 28h3.5M19 32h2.5" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round" opacity={0.45} />
      <path d="M27 28h3.5M27 31h2.5" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round" opacity={0.45} />
      <circle cx={52} cy={28} r={11} fill="currentColor" opacity={0.12} />
      <circle cx={52} cy={28} r={7.5} stroke="currentColor" strokeWidth={1.75} opacity={0.55} />
      <path
        d="M52 22.5l1.35 2.7 3 .44-2.17 2.12.51 2.99-2.69-1.42-2.69 1.42.51-2.99-2.17-2.12 3-.44z"
        fill="currentColor"
        opacity={0.82}
      />
      <circle cx={36} cy={50} r={12} fill="currentColor" opacity={0.1} />
      <path
        d="M27 47l9-5 9 5-9 5-9-5z"
        stroke="currentColor"
        strokeWidth={1.85}
        strokeLinejoin="round"
        fill="currentColor"
        opacity={0.18}
      />
      <path d="M42 47v4" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" opacity={0.7} />
      <circle cx={36} cy={53.5} r={3.5} fill="currentColor" opacity={0.72} />
      <path
        d="M33.5 56.5c1 1.8 2.5 2.8 2.5 2.8s1.5-1 2.5-2.8"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        opacity={0.55}
      />
    </IllusSvg>
  );
}

/** Профессионал P-C — специалист + авто + карта */
export function IllustrationScenarioProfessional({ className = '' }) {
  return (
    <IllusSvg className={className}>
      <SceneOrbit />
      <circle cx={28} cy={30} r={12} fill="currentColor" opacity={0.12} />
      <circle cx={28} cy={28} r={4} fill="currentColor" opacity={0.7} />
      <path
        d="M24 34v8h8v-3.5c0-2-1.6-3.5-4-3.5s-4 1.5-4 3.5V42"
        stroke="currentColor"
        strokeWidth={1.75}
        strokeLinecap="round"
      />
      <path d="M26 36h4" stroke="currentColor" strokeWidth={1.75} />
      <path
        d="M25.5 39.5l1.5 1.5 3-3"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.65}
      />
      <circle cx={52} cy={44} r={12} fill="currentColor" opacity={0.1} />
      <path
        d="M44 44h14l-1.6-4.5H45.6L44 44z"
        stroke="currentColor"
        strokeWidth={1.75}
        strokeLinejoin="round"
      />
      <path d="M46 44V38l2.8-2.4h8.4L60 38v6H46z" stroke="currentColor" strokeWidth={1.75} />
      <circle cx={48.5} cy={44} r={2.4} stroke="currentColor" strokeWidth={1.6} />
      <circle cx={55.5} cy={44} r={2.4} stroke="currentColor" strokeWidth={1.6} />
      <rect x={48} y={22} width={12} height={8} rx={1.5} stroke="currentColor" strokeWidth={1.6} />
      <path d="M50 25h7" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round" opacity={0.5} />
    </IllusSvg>
  );
}

/** Руководитель — дом + ипотека */
export function IllustrationScenarioManager({ className = '' }) {
  return (
    <IllusSvg className={className}>
      <path
        d="M22 24Q36 12 50 24Q58 36 50 50Q36 60 22 50Q14 36 22 24"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeDasharray="3.5 3"
        opacity={0.28}
      />
      <circle cx={34} cy={42} r={14} fill="currentColor" opacity={0.1} />
      <path
        d="M24 42L36 28l12 14v8H24V42z"
        stroke="currentColor"
        strokeWidth={1.85}
        strokeLinejoin="round"
      />
      <path d="M32 50v-6h8v6" stroke="currentColor" strokeWidth={1.75} />
      <circle cx={52} cy={32} r={10} fill="currentColor" opacity={0.12} />
      <path d="M48 36h8v5h-8V36z" stroke="currentColor" strokeWidth={1.6} />
      <circle cx={50} cy={40} r={1.8} fill="currentColor" opacity={0.55} />
    </IllusSvg>
  );
}

/** Предприниматель — дом + завод */
export function IllustrationScenarioEntrepreneur({ className = '' }) {
  return (
    <IllusSvg className={className}>
      <path
        d="M20 22Q36 10 52 22Q60 36 52 50Q36 62 20 50Q12 36 20 22"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeDasharray="3.5 3"
        opacity={0.28}
      />
      <circle cx={28} cy={44} r={14} fill="currentColor" opacity={0.1} />
      <path
        d="M16 50H36V40l-2.8-2.3 2.8 2.3 2.8-2.3 2.8 2.3 2.8-2.3 2.8 2.3V50H16z"
        stroke="currentColor"
        strokeWidth={1.75}
        strokeLinejoin="round"
      />
      <path d="M38 50V33h13v17H38z" stroke="currentColor" strokeWidth={1.75} />
      <path d="M42 28V23h4v5" stroke="currentColor" strokeWidth={1.75} />
      <path
        d="M43 19c0 2 1.6 3.6 3.6 3.6s3.6-1.6 3.6-3.6"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <circle cx={52} cy={30} r={10} fill="currentColor" opacity={0.12} />
      <rect x={49} y={34} width={3} height={8} rx={0.8} fill="currentColor" opacity={0.5} />
      <rect x={53.5} y={30} width={3} height={12} rx={0.8} fill="currentColor" opacity={0.65} />
      <rect x={58} y={26} width={3} height={16} rx={0.8} fill="currentColor" opacity={0.8} />
    </IllusSvg>
  );
}

const ILLUS_BY_KEY = {
  fresh_start: IllustrationScenarioStudent,
  car_loan: IllustrationScenarioProfessional,
  home_mortgage: IllustrationScenarioManager,
  debt_stack: IllustrationScenarioEntrepreneur,
  factory: IllustrationScenarioEntrepreneur,
};

export function ScenarioIllustrationIcon({ iconKey, className = '' }) {
  const C = ILLUS_BY_KEY[iconKey] || IllustrationScenarioStudent;
  return <C className={className} />;
}
