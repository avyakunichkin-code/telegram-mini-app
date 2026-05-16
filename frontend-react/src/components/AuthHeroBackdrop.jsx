import { LazyFintechTgsSticker } from './LazyFintechTgsSticker';

/**
 * Крупная TGS-анимация за контентом на экранах входа и проверки сессии.
 */
export function AuthHeroBackdrop() {
  return (
    <div className="mq-auth-bg-layer" aria-hidden>
      <div className="mq-auth-bg-lottie-slot">
        <LazyFintechTgsSticker backdrop />
      </div>
      <div className="mq-auth-bg-wash" />
    </div>
  );
}
