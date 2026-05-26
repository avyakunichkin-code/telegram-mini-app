import { useEffect, useState } from 'react';

import { showNotification } from '../../notifications';
import { MqxButton } from '../primitives/MqxButton';

export function MqxNeedsHelpSheet({ open, onClose, loadGuide }) {
  const [busy, setBusy] = useState(false);
  const [guide, setGuide] = useState(null);

  useEffect(() => {
    if (!open || guide || busy) return;
    if (!loadGuide) return;
    let cancelled = false;
    setBusy(true);
    loadGuide()
      .then((data) => {
        if (cancelled) return;
        setGuide(data);
      })
      .catch((e) => {
        if (cancelled) return;
        showNotification(e?.detail || e?.message || 'Не удалось загрузить помощь', 'error');
      })
      .finally(() => {
        if (cancelled) return;
        setBusy(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, guide, busy, loadGuide]);

  if (!open) return null;

  return (
    <div className="mqx-sheet-root" role="presentation">
      <button type="button" className="mqx-sheet-scrim" aria-label="Закрыть" onClick={onClose} />
      <section className="mqx-sheet" role="dialog" aria-modal="true" aria-labelledby="mqx-needs-help-title">
        <button type="button" className="mqx-sheet__close" onClick={onClose} aria-label="Закрыть">
          ×
        </button>
        <h2 id="mqx-needs-help-title" className="mqx-sheet__title">
          Как поддерживать баланс
        </h2>

        {busy && !guide ? (
          <p className="mqx-sheet__sub">Загружаем…</p>
        ) : (
          <div className="mqx-sheet__body">
            <div className="mqx-sheet__section">
              <h3 className="mqx-sheet__h3">Повседневно</h3>
              <ul className="mqx-sheet__list">
                {(guide?.maintenance || []).map((t, i) => (
                  // eslint-disable-next-line react/no-array-index-key -- статический список с сервера
                  <li key={i}>{t}</li>
                ))}
              </ul>
            </div>
            <div className="mqx-sheet__section">
              <h3 className="mqx-sheet__h3">Если просело</h3>
              <ul className="mqx-sheet__list">
                {(guide?.critical || []).map((t, i) => (
                  // eslint-disable-next-line react/no-array-index-key -- статический список с сервера
                  <li key={i}>{t}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <div className="mqx-sheet__actions">
          <MqxButton stretched onClick={onClose}>
            Понятно
          </MqxButton>
        </div>
      </section>
    </div>
  );
}

