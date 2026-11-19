import { useEffect, useRef, useState } from 'react';
import { financeApi } from '../../../api/finance';
import { MoneyText } from '../../MoneyText';
import { DashboardFinish, EventsPlate } from './MqxDashboardHero';
import { PersonaPortrait } from '../brand/PersonaPortrait';
import { MonetkaAvatar } from '../brand/MonetkaAvatar';
import campus from '../../../assets/menu/student-campus.png';
import coins from '../../../assets/actions/action-coins.png';
import wallet from '../../../assets/actions/action-withdraw.png';

function OperationRows({ rows }) {
  return rows.map(({ id, amount, description, period_index: turn }) => (
    <div className="mqx-wide__operation" key={id}>
      <img src={amount >= 0 ? coins : wallet} alt="" />
      <span>{description || `Операция за ход ${turn}`}</span>
      <b data-gain={amount >= 0}>{amount < 0 ? '−' : '+'}<MoneyText value={Math.abs(amount)} decimals={0} /></b>
    </div>
  ));
}

function Operations({ overview }) {
  const [result, setResult] = useState(null);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    let current = true;
    financeApi.getTransactions().then(
      (rows) => { if (current) setResult({ overview, rows }); },
      () => { if (current) setResult({ overview, error: true }); },
    );
    return () => { current = false; };
  }, [overview]);

  const rows = result?.overview === overview ? result.rows : null;
  return (
    <section className="mqx-wide__panel">
      <h2><span aria-hidden="true">▤</span> Последние операции</h2>
      {rows?.length ? <OperationRows rows={rows.slice(0, 2)} /> : (
        <p role="status">{rows ? 'Операций пока нет' : result?.overview === overview && result?.error ? 'Не удалось загрузить операции' : 'Загрузка операций…'}</p>
      )}
      {rows?.length > 0 && (
        <button type="button" className="mqx-wide__link" aria-expanded={open} onClick={() => setOpen(!open)}>
          {open ? 'Свернуть историю' : 'Вся история →'}
        </button>
      )}
      {open && rows && <OperationRows rows={rows.slice(2)} />}
    </section>
  );
}

export function MqxWideDashboard({ role, templateKey, overview, balanceHighlight, close, events, needs, finances, actions, goal, tip }) {
  const student = templateKey === 'mq_game_basic_v1';
  const helpRef = useRef(null);
  useEffect(() => {
    helpRef.current?.close();
  }, [tip?.text, overview?.period_index]);

  return (
    <div className="mqx-wide__grid">
      <div className="mqx-wide__work">
        <header className="mqx-wide__hero" data-onboarding-anchor="hero" style={{ '--campus': student ? `url(${campus})` : 'none' }}>
          <h1>{role}</h1>
          <span>На счёте</span>
          <strong className={balanceHighlight ? 'mqx-bg-turn__balance--gain' : undefined} data-mqx-juice-target="balance">
            <MoneyText value={overview?.cash_balance ?? 0} decimals={0} />
          </strong>
          {!student && <PersonaPortrait templateKey={templateKey} size="dash" className="mqx-wide__portrait" />}
          {tip?.text && (
            <>
              <button type="button" className="mqx-bg-turn__help" aria-label="Подсказка Монетки" aria-haspopup="dialog" onClick={() => helpRef.current?.showModal()}>
                <MonetkaAvatar size={32} pose={tip.pose} />
              </button>
              <dialog ref={helpRef} className="mqx-bg-turn__dialog" aria-label="Подсказка Монетки">
                <p>{tip.text}</p>
                <form method="dialog"><button type="submit" className="mqx-bg-btn mqx-bg-cta">Понятно</button></form>
              </dialog>
            </>
          )}
        </header>
        <div className="mqx-wide__panel mqx-wide__finances">{finances}</div>
        {events && <EventsPlate {...events} />}
        <section className="mqx-wide__panel">
          <h2>Действия хода</h2>
          {actions}
        </section>
      </div>
      <aside className="mqx-wide__side">
        <div className="mqx-wide__close"><DashboardFinish {...close} /></div>
        {needs && <div className="mqx-wide__panel mqx-wide__needs">{needs}</div>}
        {goal && <div className="mqx-wide__panel mqx-wide__scenario">{goal}</div>}
        <Operations overview={overview} />
      </aside>
    </div>
  );
}
