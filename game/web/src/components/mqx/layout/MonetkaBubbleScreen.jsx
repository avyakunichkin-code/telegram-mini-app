import { BrandLogo } from '../../BrandLogo';
import { Monetka } from '../brand/Monetka';

/**
 * Pre-game / auth: design-lab pg-auth-panel (логотип сверху, Монетка в шапке карточки).
 * Монетка ink 56 px без надписи — ★ pregame-monetka-round B.
 * Без MqxShell — та же вложенность, что P1–P3 в design-lab (pg-auth-stack в shell).
 * @see design-lab/pre-game-playful-v3/index.html P1–P3
 */
export function MonetkaBubbleScreen({
  title,
  subtitle,
  titleId = 'mqx-monetka-bubble-title',
  children,
  showBrand = false,
}) {
  return (
    <div className="pg-auth-stack">
      {showBrand ? (
        <header className="pg-auth-logo">
          <BrandLogo variant="full" className="pg-auth-logo__img" />
        </header>
      ) : null}
      <section className="pg-auth-panel" aria-labelledby={titleId}>
        <div className="pg-auth-panel__head">
          <Monetka className="pg-auth-panel__mascot" />
          <div className="pg-auth-panel__voice">
            <h1 id={titleId} className="pg-auth-panel__title">
              {title}
            </h1>
            {subtitle ? <div className="pg-auth-panel__subtitle">{subtitle}</div> : null}
          </div>
        </div>
        {children}
      </section>
    </div>
  );
}
