/** ★ juice A — flyout + toast после награды (зарплата и т.п.) */
export function MqxJuiceGainFeedback({ burstKey = 0, amount = 0, toastVisible = false, toastMessage = '' }) {
  const flyoutActive = burstKey > 0 && amount > 0;
  const formatted =
    amount > 0
      ? `+${Math.round(amount).toLocaleString('ru-RU')} ₽`
      : '';

  return (
    <div className="mqx-juice-layer" aria-live="polite">
      {flyoutActive ? (
        <div key={burstKey} className="mqx-juice-flyout mqx-juice-flyout--active">
          {formatted}
        </div>
      ) : null}
      <div className={`mqx-juice-toast${toastVisible ? ' mqx-juice-toast--visible' : ''}`}>
        <span className="mqx-juice-toast__icon" aria-hidden="true">
          ↑
        </span>
        <span>{toastMessage}</span>
      </div>
    </div>
  );
}
