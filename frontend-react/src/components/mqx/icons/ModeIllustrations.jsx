/** Иллюстрации режимов: Игра (сцены жизни) / План (финплан). Утверждено I1 — design-lab/new-game-mode */

export function IllustrationGame({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 72 72" width={72} height={72} aria-hidden fill="none">
      <path
        d="M23 24 Q36 12 49 24 Q58 36 49 50 Q36 60 23 50 Q14 36 23 24"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeDasharray="3.5 3"
        opacity={0.32}
      />
      <circle cx={22} cy={24} r={11} fill="currentColor" opacity={0.1} />
      <path d="M22 19l-5 5h3v4h4v-4h3l-5-5z" fill="currentColor" opacity={0.75} />
      <circle cx={50} cy={24} r={11} fill="currentColor" opacity={0.1} />
      <rect x={44} y={22} width={12} height={8} rx={1.5} stroke="currentColor" strokeWidth={1.75} />
      <path d="M47 22v-2.5h6v2.5" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
      <circle cx={36} cy={52} r={11} fill="currentColor" opacity={0.1} />
      <circle cx={36} cy={52} r={5.5} stroke="currentColor" strokeWidth={1.75} />
      <path
        d="M36 48.5v7M33.5 52h5"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        opacity={0.85}
      />
      <circle cx={36} cy={35} r={10} fill="currentColor" opacity={0.14} />
      <circle cx={36} cy={32} r={4} fill="currentColor" />
      <path
        d="M31 37c1.5 4 4.5 6 5 6s3.5-2 5-6"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IllustrationPlan({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 72 72" width={72} height={72} aria-hidden fill="none">
      <rect x={16} y={18} width={32} height={42} rx={4} stroke="currentColor" strokeWidth={2.25} />
      <path d="M26 18v-7h12v7" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
      <path d="M24 30h24M24 38h20M24 46h22" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" opacity={0.55} />
      <rect x={48} y={16} width={16} height={14} rx={2.5} stroke="currentColor" strokeWidth={1.75} />
      <path d="M48 21h16" stroke="currentColor" strokeWidth={1.5} />
      <circle cx={52} cy={25} r={1.5} fill="currentColor" opacity={0.65} />
      <circle cx={56} cy={25} r={1.5} fill="currentColor" opacity={0.65} />
      <circle cx={60} cy={25} r={1.5} fill="currentColor" opacity={0.65} />
      <rect x={48} y={44} width={7} height={12} rx={1.5} fill="currentColor" opacity={0.38} />
      <rect x={57} y={38} width={7} height={18} rx={1.5} fill="currentColor" opacity={0.52} />
      <rect x={66} y={32} width={7} height={24} rx={1.5} fill="currentColor" opacity={0.68} />
      <path
        d="M50 56l8-6 6 4 10-12"
        stroke="currentColor"
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.45}
      />
    </svg>
  );
}
