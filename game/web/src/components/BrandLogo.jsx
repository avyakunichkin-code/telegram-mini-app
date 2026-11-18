import logo120 from '../assets/brand/finance-game/logo-120.webp';
import logo240 from '../assets/brand/finance-game/logo-240.webp';
import logo480 from '../assets/brand/finance-game/logo-480.webp';
import { BRAND_NAME, BRAND_TAGLINE } from '../constants/brand';

const LOGO_SRC_SET = `${logo120} 120w, ${logo240} 240w, ${logo480} 480w`;

/** Один знак для всех экранов. variant задаёт размер и размещение. */
export function BrandLogo({ variant = 'compact', className = '', style }) {
  const sizes = {
    compact: '51px',
    full: '(max-width: 480px) 70vw, 280px',
    'finance-game': '118px',
  };

  return (
    <img
      className={['mqx-brand-logo', `mqx-brand-logo--${variant}`, className].filter(Boolean).join(' ')}
      src={logo120}
      srcSet={LOGO_SRC_SET}
      sizes={sizes[variant] ?? sizes.compact}
      alt={`${BRAND_NAME}. ${BRAND_TAGLINE}`}
      width={variant === 'full' ? 480 : 120}
      height={variant === 'full' ? 320 : 80}
      decoding="async"
      draggable={false}
      style={style}
    />
  );
}
