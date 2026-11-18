import logoCompactPng from '../assets/brand/logo-compact.png';
import logoCompactWebp from '../assets/brand/logo-compact.webp';
import logoFullPng from '../assets/brand/logo-full.png';
import logoFullWebp from '../assets/brand/logo-full.webp';
import logoFullH70Webp from '../assets/brand/logo-full-sizes/logo-full-h70.webp';
import logoFullH105Webp from '../assets/brand/logo-full-sizes/logo-full-h105.webp';
import logoFullH140Webp from '../assets/brand/logo-full-sizes/logo-full-h140.webp';
import logoFullH210Webp from '../assets/brand/logo-full-sizes/logo-full-h210.webp';
import { BRAND_NAME, BRAND_TAGLINE } from '../constants/brand';

const LOGO_FULL_WEBP_SRCSET = [
  [logoFullH70Webp, 101],
  [logoFullH105Webp, 151],
  [logoFullH140Webp, 201],
  [logoFullH210Webp, 302],
  [logoFullWebp, 402],
]
  .map(([url, w]) => `${url} ${w}w`)
  .join(', ');

const LOGO_SOURCES = {
  compact: { webp: logoCompactWebp, png: logoCompactPng },
  full: { webp: logoFullWebp, png: logoFullPng, webpSrcSet: LOGO_FULL_WEBP_SRCSET },
};

/**
 * Логотип «ТВОЙ ХОД» (мастера PNG G1/G2; в UI — WebP, PNG только fallback).
 * @param {'compact' | 'full'} variant
 *   compact — G2, игровые экраны;
 *   full — G1, стартовые экраны (с подписью в растре).
 */
export function BrandLogo({ variant = 'compact', className = '', style }) {
  const { webp, png, webpSrcSet } = LOGO_SOURCES[variant] ?? LOGO_SOURCES.compact;
  const alt = variant === 'full' ? `${BRAND_NAME}. ${BRAND_TAGLINE}` : BRAND_NAME;
  const cls = ['mqx-brand-logo', `mqx-brand-logo--${variant}`, className].filter(Boolean).join(' ');

  return (
    <picture>
      <source
        type="image/webp"
        srcSet={webpSrcSet ?? webp}
        sizes={webpSrcSet ? '(max-width: 480px) 70vw, 280px' : undefined}
      />
      <img
        className={cls}
        src={png}
        alt={alt}
        width={variant === 'full' ? 402 : undefined}
        height={variant === 'full' ? 280 : undefined}
        decoding="async"
        draggable={false}
        style={style}
      />
    </picture>
  );
}
