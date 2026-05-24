import logoCompactUrl from '../assets/brand/logo-compact.png';
import logoFullUrl from '../assets/brand/logo-full.png';
import { BRAND_NAME, BRAND_TAGLINE } from '../constants/brand';

/**
 * Логотип «ТВОЙ ХОД» (прозрачный PNG, design-lab G1/G2).
 * @param {'compact' | 'full'} variant
 *   compact — игровые экраны, слева сверху, без tagline;
 *   full — стартовые экраны, по центру (ТВОЙ ХОД + «Финансы как игра»).
 */
export function BrandLogo({ variant = 'compact', className = '', style }) {
  const cls = ['mqx-brand-logo', `mqx-brand-logo--${variant}`, className].filter(Boolean).join(' ');
  const src = variant === 'full' ? logoFullUrl : logoCompactUrl;
  const alt = variant === 'full' ? `${BRAND_NAME}. ${BRAND_TAGLINE}` : BRAND_NAME;

  return (
    <img
      className={cls}
      src={src}
      alt={alt}
      decoding="async"
      draggable={false}
      style={style}
    />
  );
}