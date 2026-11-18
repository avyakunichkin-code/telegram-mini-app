import { useSyncExternalStore } from 'react';
import { isTelegramMiniApp } from '../utils/platform';

const query = '(min-width: 1024px)';

function subscribe(callback) {
  const media = window.matchMedia(query);
  media.addEventListener('change', callback);
  return () => media.removeEventListener('change', callback);
}

function getSnapshot() {
  return !isTelegramMiniApp() && window.matchMedia(query).matches;
}

export function useWideWeb() {
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
