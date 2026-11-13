import { useCallback, useState } from 'react';
import { MqxConfirmDialog } from '../primitives/MqxConfirmDialog';

/**
 * Подтверждение разрушающего действия.
 * @returns {{ confirm: (opts) => Promise<boolean>, dialog: React.ReactNode }}
 */
export function useMqxConfirm() {
  const [state, setState] = useState(null);

  const confirm = useCallback((options) => {
    return new Promise((resolve) => {
      setState({ ...options, resolve });
    });
  }, []);

  const close = useCallback(() => {
    setState((prev) => {
      prev?.resolve?.(false);
      return null;
    });
  }, []);

  const handleConfirm = useCallback(() => {
    setState((prev) => {
      prev?.resolve?.(true);
      return null;
    });
  }, []);

  const dialog = state ? (
    <MqxConfirmDialog
      open
      title={state.title}
      message={state.message}
      confirmLabel={state.confirmLabel}
      cancelLabel={state.cancelLabel}
      onClose={close}
      onConfirm={handleConfirm}
    />
  ) : null;

  return { confirm, dialog };
}
