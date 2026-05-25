import { BrandLogo } from './BrandLogo';

/** Логотип по центру (compact G2 — без подписи «Финансы как игра»). */
export function BrandMark({ className = '', variant = 'compact' }) {
  const v = variant === 'full' ? 'full' : 'compact';
  return (
    <div
      className={['mqx-brand-mark', v === 'full' ? 'mqx-brand-mark--full' : 'mqx-brand-mark--compact', className]
        .filter(Boolean)
        .join(' ')}
    >
      <BrandLogo variant={v} />
    </div>
  );
}
