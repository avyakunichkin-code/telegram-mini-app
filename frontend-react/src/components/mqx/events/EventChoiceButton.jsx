import { truncateEventText } from './eventDisplay';

/**
 * Кнопка выбора в карточке события.
 * @param {'default'|'primary'} variant — primary = emerald (страховой полис)
 */
export function EventChoiceButton({ choice, disabled, onPick, variant = 'default' }) {
  const cls = [
    'mqx-events-choice',
    variant === 'primary' && 'mqx-events-choice--primary',
    variant === 'default' && 'mqx-events-choice--flat',
  ].filter(Boolean).join(' ');

  const xpHint = Number(choice?.xp_delta) > 0 ? `XP +${choice.xp_delta}` : null;

  return (
    <button
      type="button"
      className={cls}
      disabled={disabled}
      onClick={() => { void onPick(choice.id); }}
    >
      <span className="mqx-events-choice__title">{truncateEventText(choice.title, 96)}</span>
      {choice.description ? (
        <span className="mqx-events-choice__desc">
          {truncateEventText(choice.description, 180)}
          {xpHint ? ` · ${xpHint}` : ''}
        </span>
      ) : xpHint ? (
        <span className="mqx-events-choice__desc">{xpHint}</span>
      ) : null}
    </button>
  );
}
