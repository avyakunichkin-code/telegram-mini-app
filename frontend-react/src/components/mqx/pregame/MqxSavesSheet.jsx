import { Modal } from '@telegram-apps/telegram-ui';
import { PersonaPortrait } from '../brand/PersonaPortrait';
import { MqxModalTitle } from '../primitives/MqxModalTitle';
import { personaRoleTitle } from '../brand/personaRoles';
import { runOutcomeLabel } from '../utils/pregameDisplay';

function sortProfiles(profiles) {
  return [...(profiles || [])].sort((a, b) => {
    if (a.is_active && !b.is_active) return -1;
    if (!a.is_active && b.is_active) return 1;
    return (b.id || 0) - (a.id || 0);
  });
}

/** «Все сохранения» ★ BG-2: строка = партия (портрет, роль, название и ход); тап — открыть. */
export function MqxSavesSheet({ open, onClose, profiles, onPick, busyId = null }) {
  return (
    <Modal open={open} onOpenChange={(next) => (!next ? onClose?.() : null)} aria-describedby={undefined}>
      <div className="mqx-pg-saves">
        <MqxModalTitle className="mqx-pg-saves__title">Все сохранения</MqxModalTitle>
        <div className="mqx-pg-saves__list" role="list" aria-label="Сохранённые партии">
          {sortProfiles(profiles).map((p) => {
            const outcome = runOutcomeLabel(p);
            const sub = [`«${p.name}»`, `ход ${p.period_index}`, outcome].filter(Boolean).join(' · ');
            return (
              <div key={p.id} role="listitem">
                <button
                  type="button"
                  className="mqx-bg-btn mqx-pg-save-row"
                  disabled={busyId != null}
                  title={`Открыть «${p.name}»`}
                  onClick={() => onPick?.(p.id)}
                >
                  <PersonaPortrait templateKey={p.starter_template_key || 'mq_game_basic_v1'} size="pick" className="mqx-pg-save-row__portrait" />
                  <span className="mqx-pg-save-row__text">
                    <b>{personaRoleTitle(p.starter_template_key)}</b>
                    <small>{sub}</small>
                  </span>
                  <span className="mqx-pg-save-row__go">{p.is_active ? 'Сейчас' : 'Открыть'}</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </Modal>
  );
}
