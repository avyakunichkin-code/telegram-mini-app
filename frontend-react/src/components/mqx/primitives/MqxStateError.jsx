import { IconMetricWarn } from '../icons/FinanceMetricIcons';

/** ★ S2-B — ошибка загрузки секции: inline, повторить. */
export function MqxStateError({ title, message, retryLabel = 'Повторить', onRetry }) {
  return (
    <div className="mqx-state-error" role="alert">
      <div className="mqx-state-error__icon" aria-hidden="true">
        <IconMetricWarn size={18} />
      </div>
      <div className="mqx-state-error__body">
        <p className="mqx-state-error__title">{title}</p>
        {message ? <p className="mqx-state-error__sub">{message}</p> : null}
        {onRetry ? (
          <button type="button" className="mqx-state-error__btn" onClick={onRetry}>
            {retryLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}
