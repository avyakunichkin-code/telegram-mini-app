import { MoneyText } from '../../MoneyText';
import { PersonaPortrait } from '../brand/PersonaPortrait';
import { personaRoleTitle } from '../brand/personaRoles';

/**
 * Карта текущего сохранения ★ BG-2 (Меню): портрет, роль, ход, сумма на счёте, строка цели
 * и одна главная кнопка «Продолжить игру». Канон: design-lab/board-game/screens-round/ (Меню).
 */
export function MqxSaveCard({
  templateKey,
  periodIndex,
  cash,
  /** Третья строка: «Цель: шаг 4 из 5» в партии или название сохранения в меню старта. */
  note = null,
  onContinue,
  continueLabel = 'Продолжить игру',
  continueTitle,
  busy = false,
}) {
  const role = personaRoleTitle(templateKey);
  const turn = Number(periodIndex) || 0;

  return (
    <section className="mqx-pg-save" aria-label={`Текущая партия: ${role}`}>
      <div className="mqx-pg-save__info">
        <span className="mqx-pg-save__portrait" aria-hidden="true">
          <PersonaPortrait templateKey={templateKey || 'mq_game_basic_v1'} size="pick" />
        </span>
        <div className="mqx-pg-save__text">
          <b className="mqx-pg-save__role">{role}</b>
          <small>
            Ход {turn} · на счёте <MoneyText value={Number(cash) || 0} decimals={0} />
          </small>
          {note ? <small>{note}</small> : null}
        </div>
      </div>
      <button
        type="button"
        className="mqx-bg-btn mqx-bg-cta mqx-pg-cta"
        onClick={onContinue}
        disabled={busy}
        title={continueTitle}
      >
        {continueLabel}
      </button>
    </section>
  );
}
