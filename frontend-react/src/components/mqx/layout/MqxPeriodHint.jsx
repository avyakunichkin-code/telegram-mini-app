import { MonetkaAvatar } from '../onboarding/MonetkaAvatar';

/** Подсказка Монетки над chip-действиями периода (wink справа, пузырь слева). */
export function MqxPeriodHint() {
  return (
    <div className="mqx-period-hint mqx-period-hint--wink">
      <p className="mqx-period-hint__bubble">
        Нажми <strong>Зарплату</strong> — получишь доход за этот период.
      </p>
      <MonetkaAvatar pose="wink" size={48} className="mqx-period-hint__mascot" />
    </div>
  );
}
