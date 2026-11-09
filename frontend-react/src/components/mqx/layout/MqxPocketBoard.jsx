import { useId, useRef, useState } from 'react';
import { BrandLogo } from '../../BrandLogo';
import { MoneyText } from '../../MoneyText';
import { MonetkaAvatar } from '../brand/MonetkaAvatar';
import { PersonaPortrait } from '../brand/PersonaPortrait';
import { eventsPlateHint, eventsPlateTitle } from '../utils/boardDashDisplay';

export function MqxPocketBrand() {
  return <div className="mqx-pocket-brand"><BrandLogo variant="full" /></div>;
}

export function MqxPocketHero({ roleTitle, templateKey, periodIndex, cash, closePreview, onCloseMonth, closeMonthDisabled, juiceGainActive = false, help = null }) {
  const previewId = useId();
  const helpRef = useRef(null);
  return <header className="mqx-pocket-hero mqx-pocket-hero--g" data-onboarding-anchor="hero">
    <div className="mqx-pocket-hero__top">
      <div className="mqx-pocket-hero__logo"><BrandLogo variant="full" /></div>
      <div className="mqx-pocket-turn"><span>Ход</span><b>{String(Number(periodIndex) || 0).padStart(2, '0')}</b></div>
      <span className="mqx-pocket-role">{roleTitle}</span>
      <PersonaPortrait templateKey={templateKey} size="dash" className="mqx-pocket-persona" />
    </div>
      <div className="mqx-pocket-balance" data-mqx-juice-target="balance" data-gain={juiceGainActive || undefined}>
        <h1>На счёте</h1>
        <strong><MoneyText value={cash} decimals={0} /></strong>
      </div>
    <span className="mqx-bg-sr-only">Ход {periodIndex}</span>
    <div className={`mqx-pocket-close${help ? ' mqx-pocket-close--help' : ''}`}>
      <button type="button" className="mqx-bg-btn mqx-pocket-close__button" data-onboarding-anchor="next_period"
        disabled={closeMonthDisabled} onClick={onCloseMonth}
        aria-label="Завершить ход и перейти к следующему" aria-describedby={closePreview ? previewId : undefined}>
        Завершить ход <span aria-hidden="true">→</span>
      </button>
      <div className="mqx-pocket-forecast" id={previewId}>
        {closePreview ? <>
          <span>Спишется <b><MoneyText value={closePreview.charges} decimals={0} /></b></span>
          <span data-risk={closePreview.negative || undefined}>Останется <b><MoneyText value={closePreview.after} decimals={0} /></b></span>
        </> : <span>Прогноз закрытия<br />пока недоступен</span>}
      </div>
      {help && <button type="button" className="mqx-pocket-help" aria-label="Открыть подсказку Монетки" onClick={() => helpRef.current?.showModal()}><MonetkaAvatar pose={help.pose} size={32} /></button>}
    </div>
    {help && <dialog ref={helpRef} className="mqx-pocket-help-dialog" aria-labelledby={previewId + '-help'}>
      <button type="button" className="mqx-pocket-help-dialog__close" aria-label="Закрыть подсказку Монетки" onClick={() => helpRef.current?.close()}>×</button>
      <MonetkaAvatar pose={help.pose} size={48} /><h2 id={previewId + '-help'}>{help.title}</h2><p>{help.text}</p>
      <button type="button" className="mqx-bg-btn mqx-bg-cta" onClick={() => helpRef.current?.close()}>Понятно</button>
    </dialog>}
    {closePreview?.defeat && <p className="mqx-pocket-defeat" role="alert">Третий минус подряд — игра закончится</p>}
  </header>;
}

function storedDismissal(key) {
  try { return window.sessionStorage.getItem(key) === '1'; } catch { return false; }
}

/** Hidden reminder collapses; salary ticket keeps its own height. Key by profile + turn. */
export function MqxPocketReminder({ profileId, periodIndex, salaryAvailable, tip }) {
  const storageKey = `mqx-pocket-salary-hint:${profileId ?? 'catalog'}:${periodIndex}`;
  const [dismissed, setDismissed] = useState(() => profileId != null && storedDismissal(storageKey));
  const salaryRef = useRef(null);
  const risk = tip?.tone === 'risk';
  const visible = risk || (salaryAvailable && !dismissed);
  const text = risk ? tip.text : 'Забери зарплату до завершения хода: пропущенная выплата не переносится.';
  const dismiss = () => {
    try { if (profileId != null) window.sessionStorage.setItem(storageKey, '1'); } catch { /* in-memory dismissal still works */ }
    setDismissed(true);
    salaryRef.current?.closest('.mqx-pocket-main')?.querySelector('[data-onboarding-anchor="salary"]')?.focus({ preventScroll: true });
  };
  return <aside ref={salaryRef} className="mqx-pocket-reminder" data-hidden={!visible || undefined} data-risk={risk || undefined}
    aria-label="Подсказка Монетки" aria-hidden={!visible || undefined}>
    <MonetkaAvatar pose="think" size={28} />
    <p>{text}</p>
    {!risk ? <button type="button" className="mqx-bg-btn" onClick={dismiss} disabled={!visible} tabIndex={visible ? 0 : -1}
      aria-label="Закрыть подсказку о зарплате"><span aria-hidden="true">×</span></button> : <span className="mqx-pocket-reminder__risk" aria-hidden="true">!</span>}
  </aside>;
}

export function MqxPocketTickets({ pendingEventsCount, onOpenEvents, salaryAmount, salaryClaimed, salaryAvailable,
  salaryDisabled, busy, onSalary, salaryCelebrate = false }) {
  const count = Math.max(0, Number(pendingEventsCount) || 0);
  return <div className="mqx-pocket-tickets">
    <button type="button" className="mqx-bg-btn mqx-pocket-ticket mqx-pocket-ticket--events" data-onboarding-anchor="events"
      disabled={busy || !onOpenEvents} onClick={onOpenEvents} aria-label={`${eventsPlateTitle(count)}, ${onOpenEvents ? eventsPlateHint(count) : 'откроются по ходу игры'}`}>
      <strong>События</strong>
    </button>
    <button type="button" className="mqx-bg-btn mqx-pocket-ticket mqx-pocket-ticket--salary" data-claimed={salaryClaimed || undefined}
      data-celebrate={salaryCelebrate || undefined} data-onboarding-anchor="salary" disabled={busy || salaryDisabled}
      title={salaryClaimed ? 'Зарплата за этот ход уже получена' : salaryAvailable ? 'Получить зарплату за текущий ход' : 'Зарплата в этом ходе недоступна'}
      aria-label={salaryClaimed ? 'Зарплата, уже получена' : salaryAvailable ? 'Зарплата, получить' : 'Зарплата, недоступна'} onClick={onSalary}>
      <strong>{salaryClaimed ? 'Зарплата получена' : 'Получить зарплату'}</strong>
    </button>
  </div>;
}

export function MqxPocketNavigation({ children }) {
  return <aside className="mqx-pocket-navigation"><div className="mqx-pocket-navigation__brand"><BrandLogo variant="full" /></div>
    <p className="mqx-pocket-navigation__label">Твоя партия</p>{children}
    <div className="mqx-pocket-navigation__foot"><MonetkaAvatar size={36} /><p>Финансы как игра.<br />Решения — твои.</p></div>
  </aside>;
}
