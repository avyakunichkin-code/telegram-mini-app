import { useMemo, useState } from 'react';

import { showNotification } from '../../notifications';
import { MqxButton } from '../primitives/MqxButton';

function NeedsDeltaRow({ delta }) {
  const items = useMemo(() => {
    if (!delta) return [];
    const map = [
      ['comfort', 'Комфорт'],
      ['status', 'Статус'],
      ['social', 'Связи'],
      ['health', 'Здоровье'],
    ];
    return map
      .map(([k, label]) => {
        const v = Number(delta[k]);
        if (!Number.isFinite(v) || v === 0) return null;
        return { key: k, label, value: v };
      })
      .filter(Boolean);
  }, [delta]);

  if (!items.length) return null;

  return (
    <div className="mqx-treat__delta">
      {items.map((it) => (
        <span key={it.key} className="mqx-treat__delta-chip">
          +{Math.round(it.value)} {it.label}
        </span>
      ))}
    </div>
  );
}

export function MqxTreatSelfSheet({ open, onClose, treatSelf, treatSelfState }) {
  const options = treatSelfState?.options || [];
  const single = options.length === 1 ? options[0] : null;
  const [selectedId, setSelectedId] = useState(single?.id || '');
  const [busy, setBusy] = useState(false);

  const selected = options.find((o) => o.id === selectedId) || single;
  const available = treatSelfState?.available !== false;
  const cooldown = Number(treatSelfState?.cooldown_periods_remaining) || 0;

  if (!open) return null;

  const confirmDisabled = busy || !available || !selected?.id;

  const onConfirm = async () => {
    if (!selected?.id) return;
    try {
      setBusy(true);
      await treatSelf(selected.id);
      showNotification('Самочувствие улучшилось', 'success');
      onClose?.();
    } catch (e) {
      showNotification(e?.detail || e?.message || 'Не удалось выполнить действие', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mqx-sheet-root" role="presentation">
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

        <div className="mqx-treat__options">
          {options.map((o) => (
            <button
              key={o.id}
              type="button"
              className={`mqx-treat__card${o.id === selectedId ? ' is-selected' : ''}`}
              onClick={() => setSelectedId(o.id)}
              disabled={busy || !available}
            >
              <div className="mqx-treat__card-head">
                <div className="mqx-treat__card-title">{o.title}</div>
                {o.subtitle ? <div className="mqx-treat__card-sub">{o.subtitle}</div> : null}
              </div>
              <NeedsDeltaRow delta={o.needs_delta} />
              <div className="mqx-treat__cost">−{Math.round(Number(o.cost) || 0).toLocaleString('ru-RU')} ₽</div>
            </button>
          ))}
        </div>

        <div className="mqx-sheet__actions">
          <MqxButton stretched disabled={confirmDisabled} onClick={onConfirm}>
            {busy ? 'Подождите…' : 'Подтвердить'}
          </MqxButton>
          <MqxButton variant="secondary" stretched disabled={busy} onClick={onClose}>
            Отмена
          </MqxButton>
        </div>
      </section>
    </div>
  );
}

