import { useLayoutEffect, useState } from 'react';
import { MonetkaAvatar } from './MonetkaAvatar';
import { MqxButton } from '../primitives/MqxButton';

const PAD = 8;
const DEFAULT_BUBBLE_STYLE = { bottom: 24, left: 16, right: 16, maxWidth: 420, margin: '0 auto' };

function clampRect(rect, pad = PAD) {
  if (!rect) return null;
  return {
    top: Math.max(0, rect.top - pad),
    left: Math.max(0, rect.left - pad),
    width: rect.width + pad * 2,
    height: rect.height + pad * 2,
  };
}

function ScrimPanels({ hole }) {
  if (!hole) {
    return (
      <div
        className="mqx-onboarding-scrim mqx-onboarding-scrim--full"
        aria-hidden
      />
    );
  }

  const { top, left, width, height } = hole;
  const right = left + width;
  const bottom = top + height;

  return (
    <>
      <div className="mqx-onboarding-scrim" style={{ top: 0, left: 0, right: 0, height: top }} aria-hidden />
      <div
        className="mqx-onboarding-scrim"
        style={{ top: bottom, left: 0, right: 0, bottom: 0 }}
        aria-hidden
      />
      <div className="mqx-onboarding-scrim" style={{ top, left: 0, width: left, height }} aria-hidden />
      <div className="mqx-onboarding-scrim" style={{ top, left: right, right: 0, height }} aria-hidden />
    </>
  );
}

/**
 * Spotlight + пузырь Монетки. variant=practice — затемнение и подсветка якоря без пузыря.
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
}) {
  const [hole, setHole] = useState(null);
  const [bubbleStyle, setBubbleStyle] = useState(DEFAULT_BUBBLE_STYLE);

  useLayoutEffect(() => {
    if (!open || !rootRef?.current) {
      setHole(null);
      return undefined;
    }

    const measure = () => {
      if (!anchor) {
        setHole(null);
        setBubbleStyle(DEFAULT_BUBBLE_STYLE);
        return;
      }
      const el = rootRef.current.querySelector(`[data-onboarding-anchor="${anchor}"]`);
      if (!el) {
        setHole(null);
        setBubbleStyle(DEFAULT_BUBBLE_STYLE);
        return;
      }
      const rect = clampRect(el.getBoundingClientRect());
      setHole(rect);
      const preferBelow = rect.top + rect.height + 220 < window.innerHeight;
      if (preferBelow) {
        setBubbleStyle({
          top: rect.top + rect.height + 12,
          left: 16,
          right: 16,
          maxWidth: 420,
          margin: '0 auto',
        });
      } else {
        setBubbleStyle({
          bottom: Math.max(16, window.innerHeight - rect.top + 12),
          left: 16,
          right: 16,
          maxWidth: 420,
          margin: '0 auto',
        });
      }
    };

    measure();
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [open, anchor, rootRef]);

  if (!open || !step) return null;

  const isPractice = variant === 'practice';
  const continueLabel =
    step.gate === 'finish' ? finishLabel : step.gate === 'practice' ? 'Понятно' : null;
  const skipLabel =
    skipPressCount === 1 ? 'Пропустить (ещё раз — выйти из обучения)' : 'Пропустить шаг';

  return (
    <div
      className="mqx-onboarding-root"
      role={isPractice ? 'presentation' : 'dialog'}
      aria-modal={isPractice ? undefined : 'true'}
      aria-labelledby={isPractice ? undefined : 'mqx-onboarding-title'}
      aria-label={isPractice ? 'Практика: попробуй элементы интерфейса' : undefined}
    >
      <ScrimPanels hole={hole} />

      {hole ? (
        <div
          className="mqx-onboarding-spotlight-ring"
          style={{
            top: hole.top,
            left: hole.left,
            width: hole.width,
            height: hole.height,
          }}
          aria-hidden
        />
      ) : null}

      {isPractice ? (
        <div className="mqx-onboarding-practice-hint" aria-live="polite">
          <span className="mqx-onboarding-practice-hint__label">Практика</span>
          <span className="mqx-onboarding-practice-hint__sec">10 с · потыкай UI</span>
        </div>
      ) : null}

      {!isPractice ? (
        <div className="mqx-onboarding-bubble-wrap" style={bubbleStyle}>
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
