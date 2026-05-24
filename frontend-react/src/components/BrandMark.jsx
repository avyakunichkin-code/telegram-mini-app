import { BrandLogo } from './BrandLogo';

/** Полный логотип по центру (PNG G1 + tagline). */
export function BrandMark({ className = '' }) {
  return (
    <div className={['mqx-brand-mark', 'mqx-brand-mark--full', className].filter(Boolean).join(' ')}>
      <BrandLogo variant="full" />
    </div>
  );
}
