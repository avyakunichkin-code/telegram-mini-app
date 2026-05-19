import { MoneyText } from '../../MoneyText';
import { MqxProgress } from '../primitives/MqxProgress';

/**
 * Блок «Уровень» (H2): заголовок, XP, очки, 2 компактных bar (доход / долги).
 */
export function MqxLevelBlock({
  level,
  xp,
  xpNeed,
  xpFrac,
  score,
  bars = [],
  progressHint = null,
}) {
  return (
    <section className="mqx-level-block" aria-label={`Уровень ${level}`}>
      <div className="mqx-level-block__head">
        <div>
          <h2 className="mqx-level-block__title">Уровень {level}</h2>
          <p className="mqx-level-block__sub">
            {xp}
            {' '}
            / {xpNeed} XP
          </p>
        </div>
        <div className="mqx-level-block__score-wrap">
          <div className="mqx-level-block__score-label">Очки</div>
          <div className="mqx-level-block__score">{score}</div>
        </div>
      </div>

      <div className="mqx-level-block__meter">
        <MqxProgress value={Math.round(xpFrac * 100)} xp aria-label="Прогресс опыта" />
      </div>

      {progressHint ? (
        <p className={`mqx-level-block__hint mqx-level-block__hint--${progressHint.variant || 'progress'}`}>
          {progressHint.text}
        </p>
      ) : null}

      {bars.length > 0 ? (
        <div className="mqx-level-block__bars">
          {bars.map((b) => (
            <div key={b.label}>
              <div className="mqx-level-block__bar-row">
                <span>{b.label}</span>
                <span>
                  <MoneyText value={b.value} decimals={0} />
                </span>
              </div>
              <div className="mqx-level-block__bar-track">
                <div
                  className={`mqx-level-block__bar-fill ${b.tone}`}
                  style={{ width: `${Math.round(Math.max(0, Math.min(1, b.frac)) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
