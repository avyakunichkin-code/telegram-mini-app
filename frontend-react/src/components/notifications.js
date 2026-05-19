import { ApiError, formatApiErrorDetail } from '../api';
import { enqueueToast } from './ToastHost';

export function showNotification(message, type = 'info', options = {}) {
  let text;
  if (message == null) {
    text = 'Уведомление';
  } else if (typeof message === 'string') {
    text = message;
  } else if (message instanceof ApiError) {
    text = formatApiErrorDetail(message.detail, message.message);
  } else if (message instanceof Error) {
    text = formatApiErrorDetail(message.message, message.message || 'Ошибка');
  } else if (typeof message === 'number' || typeof message === 'boolean') {
    text = String(message);
  } else {
    text = formatApiErrorDetail(message, 'Уведомление');
  }
  const toast = {
    type,
    message: text,
  };
  if (options.ttlMs != null) {
    toast.ttlMs = options.ttlMs;
  }
  enqueueToast(toast);
}
