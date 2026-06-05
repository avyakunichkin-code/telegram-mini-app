import { useEffect, useState } from 'react';
import { isRemoteProdApi } from '../api/client';
import { wakeRemoteApi } from '../api/health';
import { markApiWarmedThisSession, shouldShowApiColdStart } from '../utils/apiWarmupSession';
import { ApiColdStartScreen } from './mqx/layout/ApiColdStartScreen';

const SLOW_HINT_MS = 12_000;

/**
 * Перед первым API в сессии (prod) — экран Монетки + health ping.
 * Dev (Vite proxy) пропускаем.
 */
export function ApiWarmupGate({ children }) {
  const needsWarmup = isRemoteProdApi() && shouldShowApiColdStart();
  const [warming, setWarming] = useState(needsWarmup);
  const [hint, setHint] = useState('Подключаемся к игре…');

  useEffect(() => {
    if (!warming) return undefined;

    let cancelled = false;
    const slowTimer = window.setTimeout(() => {
      if (!cancelled) {
        setHint('Сервер просыпается — ещё немного, не закрывайте вкладку');
      }
    }, SLOW_HINT_MS);

    wakeRemoteApi().then((result) => {
      if (cancelled) return;
      if (result.ok) {
        markApiWarmedThisSession();
      }
      setWarming(false);
    });

    return () => {
      cancelled = true;
      window.clearTimeout(slowTimer);
    };
  }, [warming]);

  if (warming) {
    return <ApiColdStartScreen hint={hint} />;
  }

  return children;
}
