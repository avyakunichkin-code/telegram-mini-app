/** Декоративные иллюстрации режимов сохранения (Игра / План). */

export function IllustrationGame({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 72 72" width={72} height={72} aria-hidden fill="none">
      <path
        d="M14 46c0-8 6.5-14.5 14.5-14.5h25c8 0 14.5 6.5 14.5 14.5v2c0 3.5-2.5 6-6 6H20c-3.5 0-6-2.5-6-6v-2z"
        stroke="currentColor"
        strokeWidth={2.25}
        strokeLinejoin="round"
      />
      <circle cx={26} cy={42} r={3} fill="currentColor" opacity={0.85} />
      <circle cx={38} cy={42} r={3} fill="currentColor" opacity={0.85} />
      <path d="M46 48h10a4 4 0 010 8H46v-8z" fill="currentColor" opacity={0.35} />
      <path
        d="M22 26l8-10 10 12 10-14 8 12"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        opacity={0.45}
      />
    </svg>
  );
}

export function IllustrationPlan({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 72 72" width={72} height={72} aria-hidden fill="none">
      <path d="M14 54V22h44v32H14z" stroke="currentColor" strokeWidth={2.25} strokeLinejoin="round" />
      <path
        d="M22 42l10-12 8 10 14-18"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.55}
      />
      <rect x={22} y={46} width={10} height={8} rx={2} fill="currentColor" opacity={0.35} />
      <rect x={36} y={40} width={10} height={14} rx={2} fill="currentColor" opacity={0.45} />
      <rect x={50} y={34} width={10} height={20} rx={2} fill="currentColor" opacity={0.55} />
    </svg>
  );
}
