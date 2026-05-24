import { BrandMark } from '../../BrandMark';
import { MqxShell } from '../../MqxShell';
import { MonetkaAvatar } from '../onboarding/MonetkaAvatar';

/**
 * Экран с Монеткой и пузырём-карточкой (auth, меню, новая игра).
 */
export function MonetkaBubbleScreen({
  title,
  subtitle,
  titleId = 'mqx-monetka-bubble-title',
  children,
  shellClassName = 'mqx-auth mqx-auth--monetka',
  bubbleClassName = '',
  showBrand = false,
}) {
  const bubbleCls = ['mqx-auth-monetka__bubble', bubbleClassName].filter(Boolean).join(' ');
  const shellCls = [shellClassName, showBrand && 'mqx-auth--brand-top'].filter(Boolean).join(' ');
  const monetkaCls = ['mqx-auth-monetka', showBrand && 'mqx-auth-monetka--brand-top'].filter(Boolean).join(' ');

  return (
    <MqxShell contentClassName={shellCls}>
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
    </MqxShell>
  );
}
