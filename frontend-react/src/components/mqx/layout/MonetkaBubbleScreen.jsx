import { BrandMark } from '../../BrandMark';
import { AuthHeroBackdrop } from '../../AuthHeroBackdrop';
import { MqxShell } from '../../MqxShell';
import { MonetkaAvatar } from '../onboarding/MonetkaAvatar';

/**
 * Экран с Монеткой и пузырём-карточкой (auth, меню). Без внешней рамки mqx-frame.
 */
export function MonetkaBubbleScreen({
  title,
  subtitle,
  titleId = 'mqx-monetka-bubble-title',
  children,
  shellClassName = 'mqx-auth mqx-auth--monetka',
  bubbleClassName = '',
  showBrand = false,
  showLottieBackdrop = false,
  frameClassName = 'mqx-frame--pre-game',
}) {
  const bubbleCls = ['mqx-auth-monetka__bubble', bubbleClassName].filter(Boolean).join(' ');
  const shellCls = [
    shellClassName,
    showBrand && 'mqx-auth--brand-top',
    showLottieBackdrop && 'mqx-auth--lottie-bg',
  ]
    .filter(Boolean)
    .join(' ');
  const monetkaCls = ['mqx-auth-monetka', showBrand && 'mqx-auth-monetka--brand-top'].filter(Boolean).join(' ');

  const monetkaBlock = (
    <div className={monetkaCls}>
      {showBrand ? <BrandMark className="mqx-auth-monetka__brand" /> : null}
      <MonetkaAvatar size={112} className="mqx-auth-monetka__mascot" />
      <section className={bubbleCls} aria-labelledby={titleId}>
        <h1 id={titleId} className="mqx-auth-monetka__title">
          {title}
        </h1>
        {subtitle ? <p className="mqx-auth-monetka__subtitle">{subtitle}</p> : null}
        {children}
      </section>
    </div>
  );

  return (
    <MqxShell contentClassName={shellCls} frameClassName={frameClassName}>
      {showLottieBackdrop ? <AuthHeroBackdrop /> : null}
      {showLottieBackdrop ? <div className="mq-auth-foreground">{monetkaBlock}</div> : monetkaBlock}
    </MqxShell>
  );
}
