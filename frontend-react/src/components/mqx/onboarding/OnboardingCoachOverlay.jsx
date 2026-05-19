import { useLayoutEffect, useState } from 'react';
import { MonetkaAvatar } from './MonetkaAvatar';
import { MqxButton } from '../primitives/MqxButton';

const PAD = 8;
const DASHBOARD_CONTEXT_ANCHOR = 'dashboard';
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

function getDashboardContextRect(rootEl) {
  if (!rootEl) return null;
  const page = rootEl.querySelector(`[data-onboarding-anchor="${DASHBOARD_CONTEXT_ANCHOR}"]`);
  if (!page) return null;
  return clampRectToViewport(page.getBoundingClientRect());
}

function getTargetRect(rootEl, anchor) {
  if (!rootEl || !anchor) return null;
  const el = rootEl.querySelector(`[data-onboarding-anchor="${anchor}"]`);
  if (!el) return null;
  return clampRectToViewport(el.getBoundingClientRect());
}

function ScrimPanels({ contextHole }) {
  if (!contextHole) {
    return <div className="mqx-onboarding-scrim mqx-onboarding-scrim--full" aria-hidden />;
  }

  return (
    <div
      className="mqx-onboarding-scrim-hole mqx-onboarding-scrim-hole--dashboard"
      style={{
        top: contextHole.top,
        left: contextHole.left,
        width: contextHole.width,
        height: contextHole.height,
      }}
      aria-hidden
    />
  );
}

/**
 * Spotlight + пузырь Монетки (фаза bubble). Практика 10 с — оверлей снимается в GameOnboardingLayer.
 * Затемнение с «окном» на весь дашборд; кольцо — на целевой элемент шага.
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
  const [contextHole, setContextHole] = useState(null);
  const [targetHole, setTargetHole] = useState(null);
  const [bubbleStyle, setBubbleStyle] = useState(DEFAULT_BUBBLE_STYLE);

  useLayoutEffect(() => {
    if (!open || !rootRef?.current) {
      setContextHole(null);
      setTargetHole(null);
      return undefined;
    }

    const root = rootRef.current;

    const measure = () => {
      const dashboardRect = getDashboardContextRect(root);
      const targetRect = getTargetRect(root, anchor);
      setContextHole(dashboardRect);
      setTargetHole(targetRect);

      const bubbleAnchor = targetRect ?? dashboardRect;
      if (!bubbleAnchor) {
        setBubbleStyle(DEFAULT_BUBBLE_STYLE);
        return;
      }
      const preferBelow = bubbleAnchor.top + bubbleAnchor.height + 220 < window.innerHeight;
      if (preferBelow) {
        setBubbleStyle({
          top: bubbleAnchor.top + bubbleAnchor.height + 12,
          left: 16,
          right: 16,
          maxWidth: 420,
          margin: '0 auto',
        });
      } else {
        setBubbleStyle({
          bottom: Math.max(16, window.innerHeight - bubbleAnchor.top + 12),
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

  useLayoutEffect(() => {
    if (!open || !anchor || !rootRef?.current) return;
    const el = rootRef.current.querySelector(`[data-onboarding-anchor="${anchor}"]`);
    el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [open, anchor, step?.id, rootRef]);

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
      <ScrimPanels contextHole={contextHole} />

      {targetHole ? (
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
