import { Button, Modal } from '@telegram-apps/telegram-ui';

/** Подтверждение опасного действия (удаление, отмена полиса). */
export function MqxConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Удалить',
  cancelLabel = 'Отмена',
  onConfirm,
  onClose,
  busy = false,
}) {
  return (
    <Modal open={open} onClose={busy ? undefined : onClose}>
      <div className="mqx-card mqx-confirm-dialog">
        <div className="mqx-card__title">{title}</div>
        {message ? <p className="mqx-card__sub mqx-confirm-dialog__message">{message}</p> : null}
        <div className="mqx-confirm-dialog__actions">
          <Button mode="outline" stretched disabled={busy} onClick={onClose}>
            {cancelLabel}
          </Button>
          <Button mode="filled" stretched disabled={busy} onClick={onConfirm}>
            {busy ? 'Подождите…' : confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
