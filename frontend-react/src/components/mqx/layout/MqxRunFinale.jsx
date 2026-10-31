import { useCallback, useEffect, useRef, useState } from 'react';
import { getPersonaPortrait } from '../brand/personaPortraits';
import { getRunFinaleCupPortrait } from '../brand/runFinalePortraits';
import { showNotification } from '../../notifications';
import {
  FINALE_LOSS_LEAD,
  FINALE_LOSS_TITLE,
  FINALE_WIN_TITLE,
  finaleDefeatFact,
  finaleWinStats,
  isFinaleWin,
} from './runFinaleDisplay';

/**
 * Финал партии ★ BG-2 (design-lab/board-game/screens-round, «Финал · Победа / Поражение»).
 * Победа — золотая клетка финиша, «Играть дальше» (партия продолжается); поражение — факт риска и советы, партия в архиве.
 */
function FinaleCell({ portrait, win }) {
  return (
    <div className={`mqx-run-finale-cell${win ? ' mqx-run-finale-cell--win' : ''}`} aria-hidden="true">
      {portrait ? (
        <picture>
          {portrait.webp ? <source srcSet={portrait.webp} type="image/webp" /> : null}
          <img className="mqx-run-finale-cell__img" src={portrait.png} alt="" decoding="async" />
        </picture>
      ) : null}
    </div>
  );
}

function FinaleFeedback({ win, onSubmit }) {
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const canSend = comment.trim().length >= 2 && !submitting && !submitted;

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (!canSend) return;
      setSubmitting(true);
      try {
        await onSubmit?.(comment.trim());
        setSubmitted(true);
        showNotification('Спасибо, отзыв отправлен', 'success');
      } catch (err) {
        showNotification(err?.message || 'Не удалось отправить', 'error');
      } finally {
        setSubmitting(false);
      }
    },
    [canSend, comment, onSubmit],
  );

  return (
    <form className="mqx-run-finale-feedback" onSubmit={handleSubmit}>
      <textarea
        className="mqx-run-finale-feedback__input"
        aria-label="Отзыв о партии (необязательно)"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder={
          win ? 'Как прошла партия? Это увидят разработчики' : 'Что было непонятно? Это увидят разработчики'
        }
        rows={2}
        disabled={submitted}
      />
      <button type="submit" className="mqx-bg-btn mqx-run-finale-link" disabled={!canSend}>
        {submitted ? 'Отзыв отправлен' : 'Отправить отзыв'}
      </button>
    </form>
  );
}

export function MqxRunFinale({ open, payload, onDismissVictory, onNewGame, onMenu, onSubmitFeedback }) {
  const titleRef = useRef(null);
  const win = isFinaleWin(payload);

  useEffect(() => {
    if (open && payload) titleRef.current?.focus();
  }, [open, payload]);

  const submitFeedback = useCallback(
    (text) => onSubmitFeedback?.({ text, outcome: payload?.outcome }),
    [onSubmitFeedback, payload?.outcome],
  );

  if (!open || !payload) return null;

  const portrait = win
    ? getRunFinaleCupPortrait(payload.persona_slug)
    : getPersonaPortrait(payload.template_key, 'dash') || getRunFinaleCupPortrait(payload.persona_slug);
  const fact = win ? null : finaleDefeatFact(payload);

  return (
    <div className="mqx-run-finale-root" data-outcome={win ? 'win' : 'defeat'} role="presentation">
      <section className="mqx-run-finale" role="dialog" aria-modal="true" aria-labelledby="mqx-run-finale-title">
        <div className="mqx-run-finale__body">
          <FinaleCell portrait={portrait} win={win} />
          <h2 id="mqx-run-finale-title" className="mqx-run-finale__title" tabIndex={-1} ref={titleRef}>
            {win ? FINALE_WIN_TITLE : FINALE_LOSS_TITLE}
          </h2>
          <p className="mqx-run-finale__lead">{win ? payload.scenario_title : FINALE_LOSS_LEAD}</p>

          {win ? (
            <dl className="mqx-run-finale-stats" aria-label="Итоги партии">
              {finaleWinStats(payload).map((s) => (
                <div key={s.key} className="mqx-run-finale-stats__cell">
                  <dt className="mqx-run-finale-stats__label">{s.label}</dt>
                  <dd className={`mqx-run-finale-stats__value${s.money ? ' mqx-run-finale-stats__value--money' : ''}`}>
                    {s.value}
                  </dd>
                </div>
              ))}
            </dl>
          ) : null}

          {fact ? (
            <>
              <p className="mqx-run-finale-fact">
                <b className="mqx-run-finale-fact__risk">{fact.title}</b> {fact.text}
              </p>
              {fact.tips.length ? (
                <ul className="mqx-run-finale-tips" aria-label="Советы на следующую партию">
                  {fact.tips.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              ) : null}
            </>
          ) : null}

          <div className="mqx-run-finale__actions">
            <button
              type="button"
              className="mqx-bg-btn mqx-bg-cta mqx-run-finale__primary"
              onClick={win ? onDismissVictory : onNewGame}
            >
              {win ? 'Играть дальше' : 'Новая игра'}
            </button>
            <button type="button" className="mqx-bg-btn mqx-run-finale-btn" onClick={win ? onNewGame : onMenu}>
              <span>{win ? 'Новая игра' : 'К сохранениям'}</span>
              <small>{win ? 'другая жизнь' : 'партия в архиве'}</small>
            </button>
          </div>

          <FinaleFeedback key={payload.outcome} win={win} onSubmit={submitFeedback} />
        </div>
      </section>
    </div>
  );
}
