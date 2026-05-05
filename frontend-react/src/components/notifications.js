// frontend-react/src/components/notifications.js
const tg = window.Telegram?.WebApp;

export function showNotification(message, type = 'info') {
  const prefix = type === 'success' ? '✅ ' : type === 'error' ? '❌ ' : '';
  alert(prefix + message);
}