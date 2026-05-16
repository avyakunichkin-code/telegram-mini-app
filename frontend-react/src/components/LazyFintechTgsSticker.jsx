import { Suspense, lazy } from 'react';

const Impl = lazy(() => import('./FintechTgsSticker'));

/**
 * Подтягивает `lottie-web` только при необходимости (вход / проверка сессии).
 */
export function LazyFintechTgsSticker({ className = '' }) {
  const fb = (
    <div
      className={`mq-auth-tgs mq-auth-tgs--skeleton${className ? ` ${className}` : ''}`}
      aria-hidden
    />
  );
  return (
    <Suspense fallback={fb}>
      <Impl className={className} />
    </Suspense>
  );
}
