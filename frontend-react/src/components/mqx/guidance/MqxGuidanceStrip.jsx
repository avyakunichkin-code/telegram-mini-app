import { useMemo } from 'react';
import { MonetkaAvatar } from '../brand/MonetkaAvatar';
import { MqxButton } from '../primitives/MqxButton';

function renderBody(text) {
  if (!text) return null;
  const parts = String(text).split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('*') && part.endsWith('*') && !part.startsWith('**')) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    }
    return part;
  });
}

/**
 * O2 bottom guidance strip над tab bar.
 * Curriculum: Монетка sit-edge у заголовка; toolbar variant A ★.
 */
export function MqxGuidanceStrip({
  ref,
  mode = 'curriculum',
  showMascot = true,
  title,
  body,
  moduleStep = 1,
  moduleStepCount = 1,
  viewIndex = 0,
  lastCompletedIndex = -1,
  beatCompleted = false,
  onDismiss,
  onPrev,
  onNext,
  onContinue,
  showNav = true,
  dismissHint,
  className = '',
}) {
  const counterLabel = useMemo(() => {
    if (mode === 'nudge') return 'Подсказка';
    return `${viewIndex + 1} из ${moduleStepCount}`;
  }, [mode, viewIndex, moduleStepCount]);

  const prevDisabled = viewIndex <= 0;
  const nextDisabled = viewIndex >= lastCompletedIndex + 1;
  const mascotOn = showMascot && Boolean(title);

  return (
    <aside
      ref={ref}
      className={`mqx-guidance-strip ${className}`.trim()}
      role="region"
      aria-label={mode === 'nudge' ? 'Подсказка' : 'Обучение'}
    >
      <div className="mqx-guidance-strip__toolbar">
        {showNav && mode === 'curriculum' ? (
          <div className="mqx-guidance-strip__nav">
            <button
              type="button"
              className="mqx-guidance-strip__arrow"
              aria-label="Назад"
              disabled={prevDisabled}
              onClick={onPrev}
            >
              ‹
            </button>
            <span className="mqx-guidance-strip__counter">{counterLabel}</span>
            <button
              type="button"
              className="mqx-guidance-strip__arrow"
              aria-label="Вперёд"
              disabled={nextDisabled}
              onClick={onNext}
            >
              ›
            </button>
          </div>
        ) : (
          <span className="mqx-guidance-strip__counter mqx-guidance-strip__counter--solo">
            {counterLabel}
          </span>
        )}
        <div className="mqx-guidance-strip__toolbar-end">
          {beatCompleted ? (
            <span className="mqx-guidance-strip__check" aria-label="Готово" role="img">
              ✓
            </span>
          ) : null}
          <button
            type="button"
            className="mqx-guidance-strip__close"
            aria-label="Закрыть подсказку"
            onClick={onDismiss}
          >
            ×
          </button>
        </div>
      </div>
      {title ? (
        <div className="mqx-guidance-strip__title-row">
          {mascotOn ? (
            <div className="mqx-guidance-strip__perch" aria-hidden="true">
              <MonetkaAvatar
                pose="sit-edge"
                size={54}
                className="mqx-guidance-strip__mascot"
              />
            </div>
          ) : null}
          <h2 className="mqx-guidance-strip__title">{title}</h2>
        </div>
      ) : null}
      {body ? <p className="mqx-guidance-strip__body">{renderBody(body)}</p> : null}
      {dismissHint ? <p className="mqx-guidance-strip__hint">{dismissHint}</p> : null}
      {onContinue ? (
        <MqxButton variant="primary" className="mqx-guidance-strip__cta" onClick={onContinue}>
          Понятно
        </MqxButton>
      ) : null}
    </aside>
  );
}
