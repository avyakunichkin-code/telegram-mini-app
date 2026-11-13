/**
 * Аватар Монетки до 120 px — `game/design-lab/mascots/ink-mascots-round/assets/monetka-ink-avatar.svg` ★ PO 2026-11-02:
 * только обод и лицо, без рук и надписи (надпись на ободе читается от 120 px — там `Monetka` с `caption`).
 * Декоративный: рядом всегда есть реплика или заголовок.
 */
export function MonetkaAvatar({ size = 40, className = '' }) {
  return (
    <svg
      className={['mqx-monetka-avatar', className].filter(Boolean).join(' ')}
      viewBox="0 0 48 48"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
    >
      <g stroke="#1d1530" strokeLinecap="round">
        <circle cx="24" cy="24" r="21" fill="#eab308" strokeWidth="3" />
        <circle cx="24" cy="24" r="14" fill="#fcf1c8" stroke="#6d28d9" strokeWidth="5" />
        <ellipse cx="19.5" cy="22" rx="1.8" ry="2.8" fill="#1d1530" stroke="none" />
        <ellipse cx="28.5" cy="22" rx="1.8" ry="2.8" fill="#1d1530" stroke="none" />
        <path d="M19.5 28 Q24 32 28.5 28" fill="none" strokeWidth="2" />
      </g>
    </svg>
  );
}
