import { BrandMark } from '../../BrandMark';
import { MqxShell } from '../../MqxShell';
import { MonetkaAvatar } from '../onboarding/MonetkaAvatar';

/**
 * Плоский flow (без рамки mqx-frame): Монетка + пузырь-подсказка, контент edge-to-edge.
 * mascotOnBlock — Монетка «сидит» на верхней кромке пузыря (как в событиях M2).
 */
export function MqxMonetkaDialogScreen({
  title,
  subtitle,
  titleId = 'mqx-monetka-dialog-title',
  children,
  mascotSize = 124,
  mascotOnBlock = true,
  mascotPose = 'sit-edge',
  showBrand = false,
}) {
  const speech = (
    <div className="mqx-monetka-dialog__speech" aria-labelledby={titleId}>
      <h1 id={titleId} className="mqx-monetka-dialog__title">
        {title}
      </h1>
      {subtitle ? <div className="mqx-monetka-dialog__subtitle">{subtitle}</div> : null}
    </div>
  );

  return (
    <MqxShell contentClassName="mqx-flow mqx-flow--monetka-dialog" frameClassName="mqx-frame--flat-flow">
      <div className={['mqx-monetka-flow', showBrand && 'mqx-monetka-flow--with-brand'].filter(Boolean).join(' ')}>
        {showBrand ? <BrandMark className="mqx-monetka-flow__brand" /> : null}
        {mascotOnBlock ? (
          <div className="mqx-monetka-dialog__perch mqx-monetka-dialog__perch--sit-edge">
            <div className="mqx-monetka-dialog__perch-head">
              <MonetkaAvatar
                pose={mascotPose}
                size={mascotSize}
                className="mqx-monetka-dialog__perch-mascot"
              />
            </div>
            {speech}
          </div>
        ) : (
          <>
            <MonetkaAvatar pose={mascotPose} size={mascotSize} className="mqx-monetka-flow__mascot" />
            {speech}
          </>
        )}
        <div className="mqx-monetka-flow__body">{children}</div>
      </div>
    </MqxShell>
  );
}
