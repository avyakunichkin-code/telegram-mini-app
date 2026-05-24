import { BrandLogo } from './BrandLogo';

/** @deprecated Используйте BrandLogo; оставлено для совместимости импортов. */
export function MqLogo({ size = 36, className = '' }) {
  const height = Math.max(18, Math.round((Number(size) || 36) * 0.62));
  return <BrandLogo variant="compact" className={className} style={{ height }} />;
}
