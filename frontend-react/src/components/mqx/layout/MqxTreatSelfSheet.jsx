import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

import { showNotification } from '../../notifications';
import { NeedsDeltaChips } from '../needs/NeedsDeltaChips';
import { MqxButton } from '../primitives/MqxButton';

function resolveSelectedOption(options, selectedId) {
  if (!options.length) return null;
  const match = options.find((o) => String(o.id) === String(selectedId));
  if (match) return match;
  return options.length === 1 ? options[0] : null;
}

export function MqxTreatSelfSheet({ open, onClose, treatSelf, treatSelfState }) {
  const options = treatSelfState?.options || [];
  const [selectedId, setSelectedId] = useState('');
  const [busy, setBusy] = useState(false);

  const available = Boolean(treatSelfState?.available);
  const cooldown = Number(treatSelfState?.cooldown_periods_remaining) || 0;
  const selected = useMemo(() => resolveSelectedOption(options, selectedId), [options, selectedId]);

  useEffect(() => {
    if (!open) {
      setBusy(false);
      return;
    }
    if (options.length === 0) {
      setSelectedId('');
      return;
    }
    if (options.length === 1) {
      setSelectedId(String(options[0]?.id || ''));
      return;
    }
    setSelectedId((prev) => {
      if (options.some((o) => String(o.id) === String(prev))) return String(prev);
      return String(options[0]?.id || '');
    });
  }, [open, options]);

  useEffect(() => {
    if (!open) return undefined;
    const body = document.body;
    const root = document.getElementById('root');
    const prevBody = body.style.overflow;
    const prevRoot = root?.style.overflow ?? '';
    body.classList.add('mqx-treat-sheet-open');
    body.style.overflow = 'hidden';
    if (root) root.style.overflow = 'hidden';
    return () => {
      body.classList.remove('mqx-treat-sheet-open');
      body.style.overflow = prevBody;
      if (root) root.style.overflow = prevRoot;
    };
  }, [open]);

  const confirmDisabled = busy || !available || !selected?.id;

  const onConfirm = async () => {
    if (!selected?.id || typeof treatSelf !== 'function') return;
    try {
      setBusy(true);
      await treatSelf(String(selected.id));
      showNotification('Потребности улучшились', 'success');
      onClose?.();
    } catch (e) {
      showNotification(e?.detail || e?.message || 'Не удалось выполнить действие', 'error');
    } finally {
      setBusy(false);
    }
  };

  if (!open) return null;

  const sheet = (
    <div className="mqx-sheet-root mqx-sheet-root--portal" role="presentation">
      <button type="button" className="mqx-sheet-scrim" aria-label="Закрыть" onClick={busy ? undefined : onClose} />
      <section className="mqx-sheet" role="dialog" aria-modal="true" aria-labelledby="mqx-treat-title">
        <button type="button" className="mqx-sheet__close" onClick={busy ? undefined : onClose} aria-label="Закрыть">
          ×
        </button>
        <h2 id="mqx-treat-title" className="mqx-sheet__title">
          Порадовать себя
        </h2>
        <p className="mqx-sheet__sub">Списание с карты. Не заменяет события — запасной путь.</p>

        {!available ? (
          <div className="mqx-treat__cooldown" role="note">
            Доступно через {cooldown} периодов
          </div>
        ) : null}

        {options.length === 0 ? (
          <p className="mqx-sheet__sub" role="note">
            Сейчас нет доступных вариантов для этого персонажа.
          </p>
        ) : (
          <div className="mqx-treat__options">
            {options.map((o) => (
              <button
                key={o.id}
                type="button"
                className={`mqx-treat__card${String(o.id) === String(selectedId) ? ' is-selected' : ''}`}
                onClick={() => setSelectedId(String(o.id))}
                disabled={busy || !available}
              >
                <div className="mqx-treat__card-head">
                  <div className="mqx-treat__card-title">{o.title}</div>
                  {o.subtitle ? <div className="mqx-treat__card-sub">{o.subtitle}</div> : null}
                </div>
                <NeedsDeltaChips delta={o.needs_delta} className="mqx-treat__delta" />
                <div className="mqx-treat__cost">−{Math.round(Number(o.cost) || 0).toLocaleString('ru-RU')} ₽</div>
              </button>
            ))}
          </div>
        )}

        <div className="mqx-sheet__actions">
          <MqxButton variant="primary" stretched disabled={confirmDisabled} onClick={onConfirm}>
            {busy ? 'Подождите…' : 'Подтвердить'}
          </MqxButton>
          <MqxButton variant="ghost" stretched disabled={busy} onClick={onClose}>
            Отмена
          </MqxButton>
        </div>
      </section>
    </div>
  );

  return createPortal(sheet, document.body);
}
