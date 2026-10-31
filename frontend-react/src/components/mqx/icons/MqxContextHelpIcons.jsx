/** Иконки контекстной справки (книга / книга+?) и treat (сердце) — MQX, без фона у кнопки справки. */

const stroke = {
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

/** Книга — базовый глиф справки. */
export function IconHelpBook({ size = 18, className }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" {...stroke} />
      <path
        d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"
        {...stroke}
      />
    </svg>
  );
}

/** Книга + «?» на странице (внутри глифа). */
export function IconHelpBookQuestionInside({ size = 18, className }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" {...stroke} />
      <path
        d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"
        {...stroke}
      />
      <path
        d="M12.25 8.35a1.4 1.4 0 1 0-2.8 0c0 .72.6 1.02 1 1.38"
        stroke="currentColor"
        strokeWidth="1.65"
        strokeLinecap="round"
      />
      <circle cx="10.85" cy="14.15" r="0.65" fill="currentColor" />
    </svg>
  );
}

/** Книга + угловой бейдж «?» (рендерится в кнопке через span). */
export function IconHelpBookWithBadge({ size = 18, className }) {
  return <IconHelpBook size={size} className={className} />;
}

/** «?» в круге — справка (★ BG-1, вместо книги). */
export function IconHelpQuestion({ size = 20, className }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9.25" {...stroke} />
      <path d="M9.6 9.4a2.45 2.45 0 1 1 3.55 2.2c-.7.35-1.15.9-1.15 1.65v.35" {...stroke} />
      <circle cx="12" cy="16.9" r="1.15" fill="currentColor" />
    </svg>
  );
}

/** Сердце с «+» справа — «улучшить потребности» (не «вопрос + сердце»). */
export function IconTreatHeartPlus({ size = 22, className, filled = false }) {
  return (
    <svg className={className} width={size * (30 / 24)} height={size} viewBox="0 0 30 24" fill="none" aria-hidden>
      <path
        d="M18.84 5.61a5 5 0 0 0-7.07 0L10.8 6.6l-.98-.98a5 5 0 0 0-7.07 7.07l8.05 8.05 8.04-8.05a5 5 0 0 0 0-7.07z"
        fill={filled ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth={filled ? 1.5 : 2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M25.5 3.5v6M22.5 6.5h6" {...stroke} strokeWidth={2.25} />
    </svg>
  );
}

/** Сердце — treat / «улучшить потребности». */
export function IconTreatHeart({ size = 16, className, filled = false }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      aria-hidden
    >
      <path
        d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"
        stroke="currentColor"
        strokeWidth={filled ? 1.5 : 2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
