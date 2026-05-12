import { enqueueToast } from './ToastHost';

export function showNotification(message, type = 'info') {
  enqueueToast({
    type,
    message,
  });
}