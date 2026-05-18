/**
 * Карточка позиции / шаблона портфеля: accent + заголовок + метрики + действие.
 * variant: asset | liability
 */
export function CapitalPositionCard({
  variant,
  kicker,
  title,
  metrics,
  action,
  actionLabel,
  actionAriaLabel,
}) {
  return (
    <article className={`mqx-capital-template-row mqx-capital-template-row--${variant}-h`}>
      <div className={`mqx-capital-template-row__accent mqx-capital-template-row__accent--${variant}`} aria-hidden="true" />
      <div className="mqx-capital-template-row__body">
        {kicker ? <div className="mqx-capital-template-row__kicker">{kicker}</div> : null}
        <div className="mqx-capital-template-row__title">{title}</div>
        {metrics}
      </div>
      {action ? (
        <button type="button" className={action.className} aria-label={actionAriaLabel} onClick={action.onClick}>
          {actionLabel}
        </button>
      ) : null}
    </article>
  );
}
