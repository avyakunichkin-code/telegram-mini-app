import { Spinner } from '@telegram-apps/telegram-ui';
import { MonetkaBubbleScreen } from './MonetkaBubbleScreen';

/** Первый вход на prod API: объясняем холодный старт Render (~20–30 с). */
export function ApiColdStartScreen({ hint }) {
  return (
    <div className="app-shell mq-page pg-app-shell mq-page--auth">
      <div className="mq-page__decor" aria-hidden />
      <MonetkaBubbleScreen
        title="Разбудим сервер"
        subtitle={
          <>
            Первый запуск после паузы может занять{' '}
            <span className="mqx-voice-em">20–30 секунд</span> — всё в порядке, просто
            подождите. Дальше обычно быстрее.
          </>
        }
        titleId="mqx-api-cold-start-title"
      >
        <div className="mqx-api-cold-start" role="status" aria-live="polite">
          <div className="mqx-auth-monetka__loading">
            <Spinner size="m" />
          </div>
          <p className="mqx-api-cold-start__hint">
            {hint || 'Подключаемся к игре…'}
          </p>
        </div>
      </MonetkaBubbleScreen>
    </div>
  );
}
