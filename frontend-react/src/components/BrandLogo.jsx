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
  const cls = ['mqx-brand-logo', `mqx-brand-logo--${variant}`, className].filter(Boolean).join(' ');
  const { webp, png } = LOGO_SOURCES[variant] ?? LOGO_SOURCES.compact;
  const alt = variant === 'full' ? `${BRAND_NAME}. ${BRAND_TAGLINE}` : BRAND_NAME;

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
