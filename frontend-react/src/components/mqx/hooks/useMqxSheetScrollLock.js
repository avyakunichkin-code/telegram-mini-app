import { useEffect } from 'react';

/** Блокирует scroll body + #root пока открыт sheet/overlay. */
export function useMqxSheetScrollLock(active) {
  useEffect(() => {
    if (!active) return undefined;
    const body = document.body;
    const root = document.getElementById('root');
    const prevBody = body.style.overflow;
    const prevRoot = root?.style.overflow ?? '';
    body.style.overflow = 'hidden';
    if (root) root.style.overflow = 'hidden';
    return () => {
      body.style.overflow = prevBody;
      if (root) root.style.overflow = prevRoot;
    };
  }, [active]);
}
