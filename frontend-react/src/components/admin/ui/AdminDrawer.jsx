import { useEffect } from 'react';
import { createPortal } from 'react-dom';

/**
 * Боковая панель поверх контента (inspector профиля и т.п.).
 */
export function AdminDrawer({ open, onClose, children, labelledBy = 'admin-inspector-title' }) {
  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="mq-admin-drawer-root">
      <button
        type="button"
        className="mq-admin-drawer__backdrop"
        aria-label="Закрыть панель"
        onClick={onClose}
      />
      <aside
        className="mq-admin-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
      >
        {children}
      </aside>
    </div>,
    document.body,
  );
}
