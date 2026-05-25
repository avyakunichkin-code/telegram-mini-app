import { useLayoutEffect, useRef, useState } from 'react';
import { MonetkaAvatar } from './MonetkaAvatar';
import { MqxButton } from '../primitives/MqxButton';

const PAD = 8;
const TARGET_PAD = 10;
const DEFAULT_BUBBLE_STYLE = { bottom: 24, left: 16, right: 16, maxWidth: 420, margin: '0 auto' };

function clampRectToViewport(rect, pad = PAD) {
  if (!rect || rect.width <= 0 || rect.height <= 0) return null;
  const top = Math.max(0, rect.top - pad);
  const left = Math.max(0, rect.left - pad);
  const right = Math.min(window.innerWidth, rect.right + pad);
  const bottom = Math.min(window.innerHeight, rect.bottom + pad);
  const width = right - left;
  const height = bottom - top;
  if (width <= 0 || height <= 0) return null;
  return { top, left, width, height };
}

function getTargetRect(rootEl, anchor) {
  if (!rootEl || !anchor) return null;
  const el = rootEl.querySelector(`[data-onboarding-anchor="${anchor}"]`);
  if (!el) return null;
  return clampRectToViewport(el.getBoundingClientRect(), TARGET_PAD);
}

/** Затемнение: «дыра» только на bubble; клики проходят сквозь scrim (pointer-events: none). */
function ScrimHole({ hole }) {
  if (!hole) {
    return <div className="mqx-onboarding-scrim mqx-onboarding-scrim--full" aria-hidden />;
  }

  return (
    <div
      className="mqx-onboarding-scrim-hole"
      style={{
        top: hole.top,
        left: hole.left,
        width: hole.width,
        height: hole.height,
      }}
      aria-hidden
    />
  );
}

/**
 * Spotlight + пузырь Монетки (фаза bubble).
 * Практика — только подсказка сверху, без scrim.
 * Подсветка: пузырь (дыра в scrim) + кольцо на целевом anchor (если есть).
 */
export function OnboardingCoachOverlay({
  open,
  step,
  skipPressCount,
  rootRef,
  anchor,
  onSkip,
  onContinue,
  finishLabel = 'Начать игру',
  variant = 'bubble',
  practiceProgress = 0,
}) {
  const bubbleWrapRef = useRef(null);
  const [bubbleHole, setBubbleHole] = useState(null);
  const [targetHole, setTargetHole] = useState(null);
  const [bubbleStyle, setBubbleStyle] = useState(DEFAULT_BUBBLE_STYLE);

  const isPractice = variant === 'practice';
  const continueLabel =
    step.gate === 'finish' ? finishLabel : step.gate === 'practice' ? 'Понятно' : null;
  const skipLabel =
    skipPressCount === 1 ? 'Пропустить (ещё раз — выйти из обучения)' : 'Пропустить шаг';

  useLayoutEffect(() => {
    if (!open || !rootRef?.current) {
      setBubbleHole(null);
      setTargetHole(null);
      return undefined;
    }

    const root = rootRef.current;

    const measure = () => {
      const targetRect = getTargetRect(root, anchor);
      setTargetHole(targetRect);

      const bubbleEl = bubbleWrapRef.current;
      const bubbleRect = bubbleEl
        ? clampRectToViewport(bubbleEl.getBoundingClientRect(), 6)
        : null;
      setBubbleHole(bubbleRect);

      const layoutAnchor = targetRect ?? bubbleRect;
      if (!layoutAnchor) {
        setBubbleStyle(DEFAULT_BUBBLE_STYLE);
        return;
      }
      const preferBelow = layoutAnchor.top + layoutAnchor.height + 220 < window.innerHeight;
      if (preferBelow) {
        setBubbleStyle({
          top: layoutAnchor.top + layoutAnchor.height + 12,
          left: 16,
          right: 16,
          maxWidth: 420,
          margin: '0 auto',
        });
      } else {
        setBubbleStyle({
          bottom: Math.max(16, window.innerHeight - layoutAnchor.top + 12),
          left: 16,
          right: 16,
          maxWidth: 420,
          margin: '0 auto',
        });
      }
    };

    measure();
    const raf = requestAnimationFrame(measure);
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);

    const bubbleEl = bubbleWrapRef.current;
    const ro =
      bubbleEl && typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(() => measure())
        : null;
    ro?.observe(bubbleEl);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
      ro?.disconnect();
    };
  }, [open, anchor, rootRef, step?.id, isPractice]);

  useLayoutEffect(() => {
    if (!open || !anchor || !rootRef?.current) return;
    const el = rootRef.current.querySelector(`[data-onboarding-anchor="${anchor}"]`);
    el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [open, anchor, step?.id, rootRef]);

  if (!open || !step) return null;

  const scrimHole = isPractice ? null : bubbleHole;

  return (
    <div
      className="mqx-onboarding-root"
      role={isPractice ? 'presentation' : 'dialog'}
      aria-modal={isPractice ? undefined : 'true'}
      aria-labelledby={isPractice ? undefined : 'mqx-onboarding-title'}
      aria-label={isPractice ? 'Практика: попробуй элементы интерфейса' : undefined}
    >
      {!isPractice ? <ScrimHole hole={scrimHole} /> : null}

      {!isPractice && targetHole ? (
        <div
          className="mqx-onboarding-spotlight-ring"
          style={{
            top: targetHole.top,
            left: targetHole.left,
            width: targetHole.width,
            height: targetHole.height,
          }}
          aria-hidden
        />
      ) : null}

      {isPractice ? (
        <div className="mqx-onboarding-practice-hint" aria-live="polite">
          <span className="mqx-onboarding-practice-hint__label">Попробуй элементы на экране</span>
          <div
            className="mqx-onboarding-practice-progress"
            role="progressbar"
            aria-label="Практика"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(practiceProgress * 100)}
          >
            <div
              className="mqx-onboarding-practice-progress__fill"
              style={{ transform: `scaleX(${practiceProgress})` }}
            />
          </div>
        </div>
      ) : null}

      {!isPractice ? (
        <div ref={bubbleWrapRef} className="mqx-onboarding-bubble-wrap" style={bubbleStyle}>
          <article className="mqx-onboarding-bubble" aria-labelledby="mqx-onboarding-title">
            <button
              type="button"
              className="mqx-onboarding-skip"
              onClick={onSkip}
              aria-label={skipLabel}
            >
              Пропустить
              {skipPressCount === 1 ? ' (ещё раз — выйти)' : ''}
            </button>
            <MonetkaAvatar size={64} />
            <h2 id="mqx-onboarding-title" className="mqx-onboarding-bubble__title">
              {step.title}
            </h2>
            <p className="mqx-onboarding-bubble__body">{step.body}</p>
            {continueLabel ? (
              <MqxButton variant="primary" className="mqx-onboarding-bubble__cta" onClick={onContinue}>
                {continueLabel}
              </MqxButton>
            ) : (
              <p className="mqx-onboarding-bubble__wait">Сделай действие в игре ↓</p>
            )}
          </article>
        </div>
      ) : null}
    </div>
  );
}
