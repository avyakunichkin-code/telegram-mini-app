import { useSyncExternalStore } from 'react';
import { networkStatus } from '../utils/networkStatus';

/** true, пока нет связи с сервером (событие `offline` или неудачный запрос). */
export function useOffline() {
  return useSyncExternalStore(networkStatus.subscribe, networkStatus.isOffline, () => false);
}
