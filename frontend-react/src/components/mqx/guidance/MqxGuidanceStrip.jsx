import { useMemo } from 'react';
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
 * O2 bottom guidance strip — без PNG Монетки, над tab bar.
 * Toolbar: навигация слева; зелёный чек + крестик справа (variant A ★).
 */
export function MqxGuidanceStrip({
  mode = 'curriculum',
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

  return (
    <aside
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
      {title ? <h2 className="mqx-guidance-strip__title mqx-voice-em">{title}</h2> : null}
      {body ? <p className="mqx-guidance-strip__body mqx-voice-em">{renderBody(body)}</p> : null}
      {dismissHint ? <p className="mqx-guidance-strip__hint">{dismissHint}</p> : null}
      {onContinue ? (
        <MqxButton variant="primary" className="mqx-guidance-strip__cta" onClick={onContinue}>
          Понятно
        </MqxButton>
      ) : null}
    </aside>
  );
}
