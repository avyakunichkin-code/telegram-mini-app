import { MqxRowAction } from '../primitives/MqxRowAction';

/**
 * Карточка позиции / шаблона портфеля: accent + заголовок + метрики + действие.
 * variant: asset | liability | insurance
 * accentTone (insurance): auto | mortgage | default
 */
export function CapitalPositionCard({
  variant,
  accentTone = 'default',
  kicker,
  title,
  metrics,
  action,
  actionLabel,
  actionAriaLabel,
}) {
  const accentClass =
    variant === 'insurance'
      ? `mqx-capital-template-row__accent--ins-${accentTone}`
      : `mqx-capital-template-row__accent--${variant}`;

  return (
    <article className={`mqx-capital-template-row mqx-capital-template-row--${variant}-h`}>
      <div className={`mqx-capital-template-row__accent ${accentClass}`} aria-hidden="true" />
      <div className="mqx-capital-template-row__body">
        {kicker ? <div className="mqx-capital-template-row__kicker">{kicker}</div> : null}
        <div className="mqx-capital-template-row__title">{title}</div>
        {metrics}
      </div>
      {action ? (
        actionLabel === '+' || actionLabel === '−' ? (
          <MqxRowAction
            variant={actionLabel === '+' ? 'add' : 'remove'}
            ariaLabel={actionAriaLabel}
            onClick={action.onClick}
            disabled={action.disabled}
            className={action.className}
          />
        ) : (
          <button type="button" className={action.className} aria-label={actionAriaLabel} onClick={action.onClick}>
            {actionLabel}
          </button>
        )
      ) : null}
    </article>
  );
}
