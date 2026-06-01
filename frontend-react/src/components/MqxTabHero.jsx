import { BrandLogo } from './BrandLogo';

/**
 * Единый «таб-хиро» для вкладок игры: логотип слева, заголовок, подзаголовок.
 */
export function MqxTabHero({
  sectionLabel,
  rightPill = null,
  title,
  subtitle = null,
  titleClassName = 'mqx-hero__title--tab',
  subtitleClassName = '',
  heroClassName = '',
  /** Заголовок вкладки в одной строке с логотипом (компактная шапка). */
  inlineTitle = false,
}) {
  const titleNode = <div className={`mqx-hero__title ${titleClassName}`.trim()}>{title}</div>;

  return (
    <header
      className={`mqx-hero mqx-hero--tab ${inlineTitle ? 'mqx-hero--inline-title' : ''} ${heroClassName}`.trim()}
    >
      <div className="mqx-hero__glow" aria-hidden />
      {inlineTitle ? (
        <div className="mqx-hero__top mqx-hero__top--inline-title">
          <div className="mqx-hero__brand-title">
            <BrandLogo variant="compact" className="mqx-hero-tab__logo" />
            {titleNode}
          </div>
          {rightPill ? <span className="mqx-hero-pill mqx-hero-pill--ghost">{rightPill}</span> : null}
        </div>
      ) : (
        <>
          <div className="mqx-hero__top">
            <div className="mqx-hero-pills">
              <BrandLogo variant="compact" className="mqx-hero-tab__logo" />
              {sectionLabel ? <span className="mqx-hero-pill">{sectionLabel}</span> : null}
            </div>
            {rightPill ? <span className="mqx-hero-pill mqx-hero-pill--ghost">{rightPill}</span> : null}
          </div>
          {titleNode}
        </>
      )}
      {subtitle ? (
        <div className={`mqx-hero__sub ${subtitleClassName}`.trim()}>{subtitle}</div>
      ) : null}
    </header>
  );
}
