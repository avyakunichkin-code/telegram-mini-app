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
