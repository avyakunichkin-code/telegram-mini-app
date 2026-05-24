import { BRAND_NAME, BRAND_TAGLINE } from '../constants/brand';
import logoCompactPng from '../assets/brand/logo-compact.png';
import logoCompactWebp from '../assets/brand/logo-compact.webp';
import logoFullPng from '../assets/brand/logo-full.png';
import logoFullWebp from '../assets/brand/logo-full.webp';

/**
 * Логотип «ТВОЙ ХОД» (прозрачный PNG/WebP, design-lab G1/G2).
 * @param {'compact' | 'full'} variant
 *   compact — игровые экраны, слева сверху, без tagline;
 *   full — стартовые экраны, по центру (ТВОЙ ХОД + «Финансы как игра»).
 */
export function BrandLogo({ variant = 'compact', className = '', style }) {
  const cls = ['mqx-brand-logo', `mqx-brand-logo--${variant}`, className].filter(Boolean).join(' ');
  const isFull = variant === 'full';
  const png = isFull ? logoFullPng : logoCompactPng;
  const webp = isFull ? logoFullWebp : logoCompactWebp;
  const alt = isFull ? `${BRAND_NAME}. ${BRAND_TAGLINE}` : BRAND_NAME;

  return (
    <picture>
      <source srcSet={webp} type="image/webp" />
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
