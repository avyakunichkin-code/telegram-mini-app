import { MonetkaAvatar } from '../brand/MonetkaAvatar';
import { MqxButton } from '../primitives/MqxButton';

const DEFEAT_COPY = {
  cash_negative_streak: {
    title: 'Минус три месяца подряд',
    body: [
      'Поражение наступает не за один день в минусе, а когда три закрытых месяца подряд итоговый баланс счёта остаётся отрицательным после автосписаний.',
      'В течение месяца баланс мог быть в плюсе — но расходы на жизнь, кредиты и обязательства списываются в конце периода. Планируй «Закрыть месяц» с учётом этих списаний.',
    ],
    tips: ['Забирай зарплату до закрытия', 'Следи за прогнозом на дашборде', 'Держи подушку на обязательные платежи'],
  },
  needs_depletion: {
    title: 'Потребности на нуле',
    body: [
      'Любая шкала потребностей (комфорт, статус, связи, здоровье) три месяца подряд на нуле — отдельное поражение.',
      'Следи за шкалами в блоке «Потребности» — события и «Побаловать себя» помогают их поднять.',
    ],
    tips: ['События с needs_delta поднимают шкалы', '«Побаловать себя» — запасной путь', 'Не игнорируй красные предупреждения'],
  },
  unknown: {
    title: 'Игра окончена',
    body: ['Партия завершена. Начните новую и примените опыт прошлого прохождения.'],
    tips: [],
  },
};

export function MqxGameOverModal({
  open,
  defeatReason = 'unknown',
  defeatPeriodIndex,
  onNewGame,
  onMenu,
}) {
  if (!open) return null;

  const copy = DEFEAT_COPY[defeatReason] || DEFEAT_COPY.unknown;

  return (
    <div className="mqx-juice-warn-root mqx-juice-warn-root--open" role="presentation">
      <div className="mqx-juice-warn-scrim" aria-hidden="true" />
      <section
        className="mqx-juice-warn-modal mqx-game-over-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="mqx-game-over-title"
      >
        <div className="mqx-juice-warn-modal__head">
          <MonetkaAvatar pose="default" size={56} />
          <div className="mqx-juice-warn-modal__copy">
            <p className="mqx-juice-warn-modal__kicker">
              {defeatPeriodIndex ? `Период ${defeatPeriodIndex}` : 'Поражение'}
            </p>
            <h3 id="mqx-game-over-title" className="mqx-juice-warn-modal__title">
              {copy.title}
            </h3>
            {copy.body.map((p) => (
              <p key={p} className="mqx-juice-warn-modal__text">
                {p}
              </p>
            ))}
            {copy.tips.length > 0 ? (
              <ul className="mqx-game-over-modal__tips">
                {copy.tips.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
        <div className="mqx-juice-warn-modal__actions">
          <MqxButton variant="primary" onClick={onNewGame}>
            Попробовать ещё раз
          </MqxButton>
          <MqxButton variant="secondary" onClick={onMenu}>
            К сохранениям
          </MqxButton>
        </div>
      </section>
    </div>
  );
}
