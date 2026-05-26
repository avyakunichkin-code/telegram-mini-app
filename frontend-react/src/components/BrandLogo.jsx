import logoCompactPng from '../assets/brand/logo-compact.png';
import logoCompactWebp from '../assets/brand/logo-compact.webp';
import logoFullPng from '../assets/brand/logo-full.png';
import logoFullWebp from '../assets/brand/logo-full.webp';
import { BRAND_NAME, BRAND_TAGLINE } from '../constants/brand';

const LOGO_SOURCES = {
  compact: { webp: logoCompactWebp, png: logoCompactPng },
  full: { webp: logoFullWebp, png: logoFullPng },
};

/**
 * Логотип «ТВОЙ ХОД» (мастера PNG G1/G2; в UI — WebP, PNG только fallback).
 * @param {'compact' | 'full'} variant
 *   compact — G2, игровые экраны, без tagline;
 *   full — G1, стартовые экраны (ТВОЙ ХОД + «Финансы как игра»).
 */
export function BrandLogo({ variant = 'compact', className = '', style }) {
  const { webp, png } = LOGO_SOURCES[variant] ?? LOGO_SOURCES.compact;
  const alt = variant === 'full' ? `${BRAND_NAME}. ${BRAND_TAGLINE}` : BRAND_NAME;

  if (variant === 'full') {
    // Full lockup is a raster PNG with baked tagline.
    // We clip the baked tagline out and render it as HTML with purple "HOD"-like 3D styling.
    return (
      <div className={['mqx-brand-logo-full-wrap', className].filter(Boolean).join(' ')} style={style}>
        <picture>
          <source type="image/webp" srcSet={webp} />
          <img
            className={['mqx-brand-logo', 'mqx-brand-logo--full', 'mqx-brand-logo--full-top'].join(' ')}
            src={png}
            alt={alt}
            aria-hidden="true"
            decoding="async"
            draggable={false}
          />
        </picture>
        <span className="mqx-brand-logo-full__tagline" aria-hidden="true">
          {BRAND_TAGLINE}
        </span>
      </div>
    );
  }

  const cls = ['mqx-brand-logo', `mqx-brand-logo--${variant}`, className].filter(Boolean).join(' ');

  return (
    <picture>
      <source type="image/webp" srcSet={webp} />
      <img
        className={cls}
        src={png}
        alt={alt}
        decoding="async"
        draggable={false}
        style={style}
      />
    </picture>
  );
}
