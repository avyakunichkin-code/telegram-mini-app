import { MonetkaAvatar } from '../onboarding/MonetkaAvatar';

/**
 * Шаги новой игры: design-lab pg-flow-wrap + Монетка на кромке пузыря.
 * Без MqxShell — прямой потомок app-shell, как P4–P5 в design-lab.
 * @see design-lab/pre-game-playful-v3/index.html P4–P5
 */
export function MqxMonetkaDialogScreen({
  title,
  subtitle,
  titleId = 'mqx-monetka-dialog-title',
  children,
  mascotSize = 124,
  mascotPose = 'sit-edge',
}) {
  return (
    <div className="pg-flow-wrap mqx-monetka-flow mqx-flow--monetka-dialog">
      <div className="mqx-monetka-dialog__perch mqx-monetka-dialog__perch--sit-edge">
        <div className="mqx-monetka-dialog__perch-head">
          <MonetkaAvatar
            pose={mascotPose}
            size={mascotSize}
            className="mqx-monetka-dialog__perch-mascot"
          />
        </div>
        <section className="mqx-monetka-dialog__speech" aria-labelledby={titleId}>
          <h1 id={titleId} className="mqx-monetka-dialog__title">
            {title}
          </h1>
          {subtitle ? <div className="mqx-monetka-dialog__subtitle">{subtitle}</div> : null}
        </section>
      </div>
      <div className="mqx-monetka-flow__body">{children}</div>
    </div>
  );
}
