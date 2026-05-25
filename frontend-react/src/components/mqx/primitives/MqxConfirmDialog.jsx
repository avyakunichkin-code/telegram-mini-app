import { Modal } from '@telegram-apps/telegram-ui';
import { MqxButton } from './MqxButton';

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
  const titleText = title || 'Подтверждение';

  return (
    <Modal open={open} onClose={busy ? undefined : onClose} title={titleText}>
      <div
        className="mqx-card mqx-confirm-dialog"
        role="document"
        aria-labelledby="mqx-confirm-dialog-title"
        aria-describedby={message ? 'mqx-confirm-dialog-message' : undefined}
      >
        <h2 id="mqx-confirm-dialog-title" className="mqx-card__title">
          {titleText}
        </h2>
        {message ? (
          <p id="mqx-confirm-dialog-message" className="mqx-card__sub mqx-confirm-dialog__message">
            {message}
          </p>
        ) : null}
        <div className="mqx-confirm-dialog__actions">
          <MqxButton
            variant="secondary"
            stretched
            disabled={busy}
            title="Отменить действие"
            onClick={onClose}
          >
            {cancelLabel}
          </MqxButton>
          <MqxButton
            variant="destructive"
            stretched
            disabled={busy}
            title={confirmLabel}
            onClick={onConfirm}
          >
            {busy ? 'Подождите…' : confirmLabel}
          </MqxButton>
        </div>
      </div>
    </Modal>
  );
}
