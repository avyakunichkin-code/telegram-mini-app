import { IllustrationGame, IllustrationPlan } from '../icons/ModeIllustrations';

/**
 * Выбор режима сохранения: Игра (активно) / План (скоро).
 * Unified strips — визуально в линии с S5-дашбордом (плоские ряды, violet accent).
 */
export function MqxSaveKindPicker({
  onSelectGame,
  gameTitle = 'Игра',
  gameDesc = 'Готовые сценарии, события и цели победы.',
  planTitle = 'План',
  planDesc = 'Свои цифры и статьи расходов.',
  planSoon = true,
  className = '',
}) {
  return (
    <div className={['mqx-save-kind', className].filter(Boolean).join(' ')} role="group" aria-label="Режим сохранения">
      <button
        type="button"
        className="mqx-save-kind__row mqx-save-kind__row--game"
        title="Симулятор с готовым сценарием"
        aria-label={`${gameTitle} — выбрать и перейти к шаблону`}
        onClick={onSelectGame}
      >
        <span className="mqx-save-kind__icon-wrap mqx-save-kind__icon-wrap--game" aria-hidden>
          <IllustrationGame className="mqx-save-kind__icon" />
        </span>
        <span className="mqx-save-kind__body">
          <span className="mqx-save-kind__title">{gameTitle}</span>
          <span className="mqx-save-kind__desc">{gameDesc}</span>
        </span>
        <span className="mqx-save-kind__trail" aria-hidden>
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
            <path
              d="M9 6l6 6-6 6"
              stroke="currentColor"
              strokeWidth="2.25"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </button>

      <div
        className={`mqx-save-kind__row mqx-save-kind__row--plan${planSoon ? ' mqx-save-kind__row--soon' : ''}`}
        role={planSoon ? 'status' : undefined}
        aria-label={planSoon ? `${planTitle} — скоро` : planTitle}
      >
        {planSoon ? <span className="mqx-save-kind__badge">Скоро</span> : null}
        <span className="mqx-save-kind__icon-wrap mqx-save-kind__icon-wrap--plan" aria-hidden>
          <IllustrationPlan className="mqx-save-kind__icon" />
        </span>
        <span className="mqx-save-kind__body">
          <span className="mqx-save-kind__title">{planTitle}</span>
          <span className="mqx-save-kind__desc">{planDesc}</span>
        </span>
      </div>
    </div>
  );
}
