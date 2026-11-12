import { useLayoutEffect } from 'react';

const LAYOUT_ATTR = 'data-mq-layout';

/**
 * Desktop-first оболочка для /admin: снимает TMA-рамку 480px с #root.
 */
export function AdminWebShell({ children }) {
  useLayoutEffect(() => {
    const root = document.documentElement;
    root.setAttribute(LAYOUT_ATTR, 'admin');
    return () => {
      root.removeAttribute(LAYOUT_ATTR);
    };
  }, []);

  return (
    <div className="mq-admin-web">
      <main className="mq-admin-web__main">{children}</main>
    </div>
  );
}
