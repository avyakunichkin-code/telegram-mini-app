import { useEffect, useState } from 'react';
import { Spinner } from '@telegram-apps/telegram-ui';
import { MonetkaBubbleScreen } from './MonetkaBubbleScreen';

const COPY = {
  cold_start: {
    title: 'Разбудим сервер',
    subtitle: (
      <>
        Первый запуск после паузы может занять{' '}
        <span className="mqx-voice-em">20–30 секунд</span> — всё в порядке, просто
        подождите. Дальше обычно быстрее.
      </>
    ),
    hintDefault: 'Подключаемся к игре…',
    hintSlow: 'Сервер просыпается — ещё немного, не закрывайте вкладку',
  },
  session: {
    title: 'Секунду, листаю полки',
    subtitle: 'Подтягиваю твои сохранения…',
    hintDefault: 'Проверяем вход…',
    hintSlow: 'Сервер отвечает дольше обычного — подождите ещё немного',
  },
};

const SLOW_HINT_MS = 12_000;

/**
 * @param {'cold_start' | 'session'} mode
 */
export function AppBootstrapScreen({ mode = 'session' }) {
  const copy = COPY[mode] ?? COPY.session;
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
