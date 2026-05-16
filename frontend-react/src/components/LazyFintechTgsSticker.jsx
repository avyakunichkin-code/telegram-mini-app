import { Suspense, lazy } from 'react';

const Impl = lazy(() => import('./FintechTgsSticker'));

/**
 * Подтягивает `lottie-web` только при необходимости (вход / проверка сессии).
 */
export function LazyFintechTgsSticker({ className = '', backdrop = false }) {
  const skeletonCls = ['mq-auth-tgs', 'mq-auth-tgs--skeleton', backdrop && 'mq-auth-tgs--backdrop']
    .filter(Boolean)
    .join(' ');
  const fb = (
    <div className={[skeletonCls, className].filter(Boolean).join(' ')} aria-hidden />
  );
  return (
    <Suspense fallback={fb}>
      <Impl className={className} backdrop={backdrop} />
    </Suspense>
  );
}
