import { Modal } from '@telegram-apps/telegram-ui';
import { MqxButton } from './MqxButton';
import { MqxModalDescription, MqxModalTitle } from './MqxModalTitle';

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
    <Modal
      open={open}
      onOpenChange={(next) => (!next && !busy ? onClose?.() : null)}
      {...(message ? {} : { 'aria-describedby': undefined })}
    >
      <div className="mqx-card mqx-confirm-dialog">
        <MqxModalTitle className="mqx-card__title">
          {titleText}
        </MqxModalTitle>
        {message ? (
          <MqxModalDescription className="mqx-card__sub mqx-confirm-dialog__message">
            {message}
          </MqxModalDescription>
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
