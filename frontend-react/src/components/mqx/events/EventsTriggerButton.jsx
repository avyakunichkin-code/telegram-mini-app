import { Button } from '@telegram-apps/telegram-ui';

/**
 * @deprecated Используйте MqxPill с events и badge на дашборде.
 * Оставлено для совместимости со старыми экранами.
 */
export function EventsTriggerButton({ count, open, onOpen }) {
  if (count <= 0) return null;
  return (
    <div className="tma-events-trigger-wrap">
      <Button size="s" mode={open ? 'filled' : 'outline'} className="tma-events-trigger" onClick={onOpen}>
        События
        <span className="tma-events-badge" aria-hidden>
          {count}
        </span>
      </Button>
    </div>
  );
}
