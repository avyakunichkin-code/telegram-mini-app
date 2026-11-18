import { useEffect, useState } from 'react';
import { Spinner } from '@telegram-apps/telegram-ui';
import { getBootstrapCopy } from '../../../utils/bootstrapCopy';
import { MonetkaBubbleScreen } from './MonetkaBubbleScreen';

const SLOW_HINT_MS = 12_000;

/**
 * @param {'cold_start' | 'session'} mode
 */
export function AppBootstrapScreen({ mode = 'session' }) {
  const copy = getBootstrapCopy(mode);
  const [hint, setHint] = useState(copy.hintDefault);

  useEffect(() => {
    setHint(copy.hintDefault);
    const timer = window.setTimeout(() => setHint(copy.hintSlow), SLOW_HINT_MS);
    return () => window.clearTimeout(timer);
  }, [mode, copy.hintDefault, copy.hintSlow]);

  return (
    <div className="app-shell mq-page pg-app-shell mq-page--auth">
      <div className="mq-page__decor" aria-hidden />
      <MonetkaBubbleScreen
        title={copy.title}
        subtitle={copy.subtitle}
        titleId="mqx-app-bootstrap-title"
      >
        <div className="mqx-api-cold-start" role="status" aria-live="polite">
          <div className="mqx-auth-monetka__loading">
            <Spinner size="m" />
          </div>
          <p className="mqx-api-cold-start__hint">{hint}</p>
        </div>
      </MonetkaBubbleScreen>
    </div>
  );
}
