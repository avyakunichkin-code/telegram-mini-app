import { useEffect, useMemo, useState } from 'react';

let listeners = new Set();

export function enqueueToast(toast) {
  for (const l of listeners) l(toast);
}

export function ToastHost() {
  const [items, setItems] = useState([]);

  const remove = (id) => setItems((prev) => prev.filter((x) => x.id !== id));

  const api = useMemo(
    () => ({
      push(toast) {
        const id = toast.id ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
        const ttlMs = toast.ttlMs ?? 2500;
        const normalized = {
          id,
          type: toast.type ?? 'info',
          message: String(toast.message ?? ''),
          ttlMs,
        };
        setItems((prev) => [...prev, normalized]);
        window.setTimeout(() => remove(id), ttlMs);
      },
    }),
    []
  );

  useEffect(() => {
    const listener = (toast) => api.push(toast);
    listeners.add(listener);
    return () => listeners.delete(listener);
  }, [api]);

  if (items.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        left: 12,
        right: 12,
        bottom: 92,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        zIndex: 9999,
        pointerEvents: 'none',
      }}
    >
      {items.map((t) => (
        <div
          key={t.id}
          style={{
            pointerEvents: 'none',
            padding: '10px 12px',
            borderRadius: 12,
            background:
              t.type === 'success'
                ? 'rgba(24, 160, 88, 0.92)'
                : t.type === 'error'
                  ? 'rgba(224, 49, 49, 0.92)'
                  : 'rgba(0, 0, 0, 0.72)',
            color: 'white',
            boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
            fontSize: 14,
            lineHeight: 1.2,
          }}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}

