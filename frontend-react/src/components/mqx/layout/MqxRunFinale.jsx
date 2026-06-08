import { useCallback, useState } from 'react';
import { MonetkaAvatar } from '../brand/MonetkaAvatar';
import { getRunFinaleCupPortrait } from '../brand/runFinalePortraits';
import { TURN_SINGULAR_GEN } from '../../../constants/turnCopy';
import { MqxButton } from '../primitives/MqxButton';
import { showNotification } from '../../notifications';
import { VICTORY_NEXT_SCENARIOS } from './runFinaleNextScenarios';

const GLYPHS = {
  up: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 19V7" />
      <path d="m7 12 5-5 5 5" />
    </svg>
  ),
  down: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 5v12" />
      <path d="m7 10 5 5 5-5" />
    </svg>
  ),
  coin: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v8" />
      <path d="M9 12h6" />
    </svg>
  ),
  term: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 4v16" />
      <path d="M17 4v16" />
      <path d="M7 8h10" />
      <path d="M7 16h6" />
    </svg>
  ),
  goal: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 12 10 16 18 8" />
    </svg>
  ),
};

function GazetaStat({ metric }) {
  const glyph = GLYPHS[metric.glyph] || GLYPHS.coin;
  return (
    <article className="mqx-run-finale-stat">
      <h5 className="mqx-run-finale-stat__headline">{metric.headline}</h5>
      <div className="mqx-run-finale-stat__line">
        <span className={`mqx-run-finale-stat__glyph mqx-run-finale-stat__glyph--${metric.glyph}`}>
          {glyph}
        </span>
        <span className="mqx-run-finale-stat__name">{metric.name}</span>
        <span className="mqx-run-finale-stat__value">{metric.value}</span>
      </div>
    </article>
  );
}

function RunFinaleNextScenarios({ onStartScenario, busy }) {
  return (
    <section className="mqx-run-finale-next" aria-labelledby="mqx-run-finale-next-title">
      <h4 id="mqx-run-finale-next-title" className="mqx-run-finale-next__title">
        Попробовать другого персонажа
      </h4>
      <p className="mqx-run-finale-next__lead">Новое сохранение с другим стартовым набором</p>
      <div className="mqx-run-finale-next__row">
        {VICTORY_NEXT_SCENARIOS.map((scenario) => {
          const cup = getRunFinaleCupPortrait(scenario.personaSlug);
          return (
            <div key={scenario.template_key} className="mqx-run-finale-next__col">
              <button
                type="button"
                className="mqx-run-finale-next__chip"
                disabled={busy}
                onClick={() => onStartScenario?.(scenario.template_key)}
              >
                <span className="mqx-run-finale-next__mascot" aria-hidden="true">
                  <picture>
                    {cup?.webp ? <source srcSet={cup.webp} type="image/webp" /> : null}
                    <img src={cup?.png} alt="" height={52} decoding="async" />
                  </picture>
                </span>
                <span className="mqx-run-finale-next__chip-title">{scenario.title}</span>
              </button>
              <ul className="mqx-run-finale-next__starter-list">
                {scenario.starterLines.map((line) => (
                  <li key={line}>+ {line}</li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function MqxRunFinale({
  open,
  payload,
  onDismissVictory,
  onNewGame,
  onStartAdvancedScenario,
  onMenu,
  onSubmitFeedback,
}) {
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [startingScenario, setStartingScenario] = useState(false);

  const isWin = payload?.outcome === 'victory';
  const cup = getRunFinaleCupPortrait(payload?.persona_slug);
  const showNextScenarios =
    isWin &&
    payload?.template_key === 'mq_game_basic_v1' &&
    typeof onStartAdvancedScenario === 'function';

  const handleStartScenario = useCallback(
    async (templateKey) => {
      if (startingScenario) return;
      setStartingScenario(true);
      try {
        await onStartAdvancedScenario?.(templateKey);
      } finally {
        setStartingScenario(false);
      }
    },
    [onStartAdvancedScenario, startingScenario],
  );

  const handleSubmitFeedback = useCallback(
    async (e) => {
      e.preventDefault();
      const text = comment.trim();
      if (text.length < 2 || submitting || submitted) return;
      setSubmitting(true);
      try {
        await onSubmitFeedback?.({ text, outcome: payload?.outcome });
        setSubmitted(true);
        showNotification('Спасибо, комментарий отправлен', 'success');
      } catch (err) {
        showNotification(err?.message || 'Не удалось отправить', 'error');
      } finally {
        setSubmitting(false);
      }
    },
    [comment, submitting, submitted, onSubmitFeedback, payload?.outcome],
  );

  if (!open || !payload) return null;

  const mastSub = isWin ? 'победа сценария' : 'итог партии';
  const badgeLabel = isWin ? 'Победа' : 'Поражение';

  return (
    <div
      className="mqx-run-finale-root mqx-run-finale-root--open"
      data-outcome={isWin ? 'win' : 'defeat'}
      role="presentation"
    >
      <div className="mqx-run-finale-scrim" aria-hidden="true" />
      <section
        className="mqx-run-finale"
        role="dialog"
        aria-modal="true"
        aria-labelledby="mqx-run-finale-title"
      >
        <div className="mqx-run-finale__scroll">
          <header className="mqx-run-finale-mast">
            <span className={`mqx-run-finale-badge mqx-run-finale-badge--${isWin ? 'win' : 'loss'}`}>
              {badgeLabel}
            </span>
            <h3 id="mqx-run-finale-title">ТВОЙ ХОД · выпуск</h3>
            <p className="mqx-run-finale-mast__sub">
              {payload.period_index} {TURN_SINGULAR_GEN} · {mastSub}
            </p>
          </header>

          <div className="mqx-run-finale-body">
            <div className="mqx-run-finale-scenario">
              <h4 className="mqx-run-finale-scenario__title">{payload.scenario_title}</h4>
              <p className="mqx-run-finale-scenario__line">{payload.scenario_line}</p>
            </div>

            {isWin ? (
              <div className="mqx-run-finale-hero">
                <div className="mqx-run-finale-hero__persona">
                  <picture>
                    {cup?.webp ? <source srcSet={cup.webp} type="image/webp" /> : null}
                    <img
                      className="mqx-run-finale-hero__img"
                      src={cup?.png}
                      alt=""
                      height={108}
                      decoding="async"
                    />
                  </picture>
                </div>
                {payload.gazeta_lead ? (
                  <p className="mqx-run-finale-hero__lead">{payload.gazeta_lead}</p>
                ) : null}
              </div>
            ) : (
              <div className="mqx-run-finale-bubble">
                <MonetkaAvatar pose="default" size={44} className="mqx-run-finale-bubble__monetka" />
                <div>
                  <p className="mqx-run-finale-bubble__title">{payload.coach_title}</p>
                  <p className="mqx-run-finale-bubble__text">{payload.coach_text}</p>
                </div>
              </div>
            )}

            <div className="mqx-run-finale-metrics" aria-label="Итоги партии">
              {payload.sections?.map((section) => (
                <div key={section.title}>
                  {section.divider_before ? (
                    <div className="mqx-run-finale-metrics__divider" role="presentation" />
                  ) : null}
                  <section className="mqx-run-finale-metrics__group">
                    <h4 className="mqx-run-finale-metrics__title">{section.title}</h4>
                    {section.metrics?.map((m) => (
                      <GazetaStat key={`${section.title}-${m.headline}`} metric={m} />
                    ))}
                  </section>
                </div>
              ))}
            </div>

            {!isWin && payload.fact ? (
              <section className="mqx-run-finale-fact" aria-labelledby="mqx-run-finale-fact-label">
                <div className="mqx-run-finale-fact__rule" aria-hidden="true" />
                <h4 id="mqx-run-finale-fact-label" className="mqx-run-finale-fact__label">
                  Факт
                </h4>
                <p className="mqx-run-finale-fact__text">{payload.fact.text}</p>
                {payload.fact.tips?.length ? (
                  <ul className="mqx-run-finale-fact__tips">
                    {payload.fact.tips.map((t) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ul>
                ) : null}
              </section>
            ) : null}

            <form className="mqx-run-finale-feedback" onSubmit={handleSubmitFeedback}>
              <label className="mqx-run-finale-feedback__label" htmlFor="mqx-run-finale-comment">
                Расскажите, как прошла партия
                <span className="mqx-run-finale-feedback__hint"> (необязательно)</span>
              </label>
              <textarea
                id="mqx-run-finale-comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Что было непонятно или что понравилось?"
                rows={3}
                disabled={submitted}
              />
              <MqxButton
                type="submit"
                variant="primary"
                disabled={comment.trim().length < 2 || submitting || submitted}
              >
                {submitted ? 'Отправлено' : 'Отправить отзыв'}
              </MqxButton>
            </form>

            {showNextScenarios ? (
              <RunFinaleNextScenarios
                onStartScenario={handleStartScenario}
                busy={startingScenario}
              />
            ) : null}
          </div>
        </div>

        <div className="mqx-run-finale__actions">
          {isWin ? (
            <MqxButton variant="primary" onClick={onDismissVictory} disabled={startingScenario}>
              Играть дальше в этом сохранении
            </MqxButton>
          ) : (
            <MqxButton variant="primary" onClick={onNewGame}>
              Новая игра
            </MqxButton>
          )}
          <MqxButton variant="ghost" onClick={onMenu} disabled={startingScenario}>
            К сохранениям
          </MqxButton>
        </div>
      </section>
    </div>
  );
}
