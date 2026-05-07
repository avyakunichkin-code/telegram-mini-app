/** Небольшие outline-иконки для строк статистики (замена эмодзи на главной). */

export function IconWalletStat({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="mq-stat-ico" aria-hidden>
      <path
        d="M19 9V8a3 3 0 00-3-3H8a4 4 0 100 8h11a3 3 0 013 3v6H8a4 4 0 01-4-4V11a5 5 0 013.5-4.76"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="16" cy="14" r="1.3" fill="currentColor" />
    </svg>
  );
}

export function IconShieldStat({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="mq-stat-ico mq-stat-ico--muted" aria-hidden>
      <path
        d="M12 3l8 4v7c0 5-4.5 7-8 10-3.5-3-8-5-8-10V7l8-4z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M12 11v7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export function IconFlowStat({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="mq-stat-ico mq-stat-ico--emerald" aria-hidden>
      <path d="M5 17h14M13 17l5-7-4-6-7 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconOverdueStat({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="mq-stat-ico mq-stat-ico--danger" aria-hidden>
      <circle cx="12" cy="14" r="7" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 10v5M12 17h.01" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function IconTargetStat({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="mq-stat-ico mq-stat-ico--violet" aria-hidden>
      <circle cx="12" cy="13" r="8" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="13" r="3.5" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

export function IconStreakStat({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="mq-stat-ico mq-stat-ico--violet" aria-hidden>
      <path d="M6 9h4M6 13h4M6 17h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path
        d="M14 8l2.5 3L20 7"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconStarStat({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="mq-stat-ico mq-stat-ico--violet" aria-hidden>
      <path
        d="M12 5.5l1.76 4.56h4.8l-3.86 3 1.52 4.94L12 16.9l-4.22 2.1 1.52-4.94-3.86-3h4.8L12 5.5z"
        stroke="currentColor"
        strokeWidth="1.55"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconBarsStat({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="mq-stat-ico mq-stat-ico--muted" aria-hidden>
      <path d="M6 17V10M11 17V7M16 17v-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M5 21h14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export function IconDownStat({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="mq-stat-ico mq-stat-ico--violet" aria-hidden>
      <path d="M12 17V8M16 13l-4 4.5L8 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconWrenchStat({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="mq-stat-ico mq-stat-ico--muted" aria-hidden>
      <path
        d="M15.26 12.94l-.07.07m-9.73 7.73a8 8 0 019.15-13.15l-.88 2a6 6 0 014.94 9.94l-.88 2"
        stroke="currentColor"
        strokeWidth="1.55"
        strokeLinecap="round"
      />
      <circle cx="7.5" cy="16.5" r="1.5" stroke="currentColor" strokeWidth="1.55" />
    </svg>
  );
}

export function IconPercentStat({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="mq-stat-ico mq-stat-ico--emerald" aria-hidden>
      <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="16" cy="16" r="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M17 8L8 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function IconXpStat({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="mq-stat-ico mq-stat-ico--violet" aria-hidden>
      <path
        d="M7 21h10v-9H7v9z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M10 21V12h4v9M12 9V5M9 8l3-4 3 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
