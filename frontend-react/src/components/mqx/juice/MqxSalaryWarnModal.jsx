import { MonetkaAvatar } from '../onboarding/MonetkaAvatar';
import { MqxButton } from '../primitives/MqxButton';

/** ★ juice D — зарплата сгорит: Монетка + последствие, не системный alert. */
export function MqxSalaryWarnModal({ open, salaryAmount = 0, onClose, onConfirmSkip }) {
  if (!open) return null;

  const amountLabel =
    salaryAmount > 0
      ? `${Math.round(salaryAmount).toLocaleString('ru-RU')} ₽`
      : 'начисление';

  return (
    <div className="mqx-juice-warn-root mqx-juice-warn-root--open" role="presentation">
      <button type="button" className="mqx-juice-warn-scrim" aria-label="Закрыть" onClick={onClose} />
      <section
        className="mqx-juice-warn-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="mqx-juice-warn-title"
      >
        <div className="mqx-juice-warn-modal__head">
          <MonetkaAvatar pose="default" size={56} />
          <div className="mqx-juice-warn-modal__copy">
            <p className="mqx-juice-warn-modal__kicker">Перед ходом</p>
            <h3 id="mqx-juice-warn-title" className="mqx-juice-warn-modal__title">
              Зарплата сгорит
            </h3>
            <p className="mqx-juice-warn-modal__text">
              Если закроешь месяц сейчас, <strong>{amountLabel}</strong> за этот период не придут — в
              следующем ходу их уже не забрать.
            </p>
          </div>
        </div>
        <div className="mqx-juice-warn-modal__actions">
          <MqxButton variant="primary" onClick={onClose}>
            Сначала зарплата
          </MqxButton>
          <MqxButton variant="secondary" className="mqx-juice-warn-modal__btn-skip" onClick={onConfirmSkip}>
            Всё равно закрыть
          </MqxButton>
        </div>
      </section>
    </div>
  );
}
