import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BrandLogo } from '../../BrandLogo';
import { BottomGameNav } from '../../BottomGameNav';
import { MqxButton } from '../primitives/MqxButton';
import { MqxNeedsDash } from '../layout/MqxNeedsDash';
import { MqxPeriodActions } from '../layout/MqxPeriodActions';
import { MqxAnalyticsPage } from '../layout/MqxAnalyticsPage';
import { MqxMenuPage } from '../layout/MqxMenuPage';
import { MqxWideCapital } from '../layout/MqxWideCapital';
import { MqxCapitalPreview } from './MqxCapitalPreview';
import campus from '../../../assets/menu/student-campus.png';
import calendar from '../../../assets/dashboard/calendar.png';
import coins from '../../../assets/actions/action-coins.png';
import shield from '../../../assets/actions/action-shield.png';
import wallet from '../../../assets/actions/action-withdraw.png';

const tabs = ['dashboard', 'finance', 'analytics', 'menu'];
const needs = { comfort: 72, status: 64, social: 81, health: 56 };
const rub = (value) => new Intl.NumberFormat('ru-RU').format(value) + ' ₽';

export function MqxDesktopPreview() {
  const [params, setParams] = useSearchParams();
  const selected = params.get('tab');
  const tab = tabs.includes(selected) ? selected : 'dashboard';
  const go = (next) => setParams(next === 'dashboard' ? {} : { tab: next });
  const [turn, setTurn] = useState(8);
  const [cash, setCash] = useState(42000);
  const [reserve, setReserve] = useState(15000);
  const [claimed, setClaimed] = useState(false);
  const [events, setEvents] = useState(3);
  const [sheet, setSheet] = useState(null);
  const [history, setHistory] = useState([['В подушку', -5000], ['Подработка', 3000]]);
  const [notice, setNotice] = useState('');
  const [positions, setPositions] = useState([{ id: 1, kind: 'deposit', title: 'Вклад', principal: 20000, annual_rate_percent: 14 }]);
  const goal = Math.min(5, Math.floor(reserve / 7500));
  const dialogRef = useRef(null);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (sheet && dialog && !dialog.open) dialog.showModal();
  }, [sheet]);

  function record(label, amount) {
    setCash(cash + amount);
    setHistory([[label, amount], ...history]);
  }

  function confirm() {
    if (sheet === 'Завершить ход') {
      record('Расходы за ход', -30000);
      setTurn(turn + 1);
      setClaimed(false);
      setEvents(3);
    } else if (sheet === 'События') {
      record('Подработка', 3000);
      setEvents(events - 1);
    } else {
      const amount = sheet === 'В подушку' ? -5000 : 5000;
      record(sheet, amount);
      setReserve(reserve - amount);
    }
    setSheet(null);
  }

  return (
    <div className="mqx-wide mqx-desktop-lab">
      <header className="mqx-wide__header">
        <BrandLogo variant="finance-game" />
        <BottomGameNav activeTab={tab} setActiveTab={go} />
        <strong className="mqx-wide__turn">Ход {turn}</strong>
      </header>
      <div className="mqx-wide__main">
        {tab === 'dashboard' && <main className="mqx-wide__grid">
          <div className="mqx-wide__work">
          <section className="mqx-wide__hero" style={{ '--campus': 'url(' + campus + ')' }}>
            <h1>Студент</h1><span>На счёте</span><strong>{rub(cash)}</strong>
          </section>
            <section className="mqx-wide__panel mqx-wide__numbers" aria-label="Финансы">
              {[[coins, 'Доходы', 35000], [wallet, 'Расходы', 30000], [shield, 'Подушка', reserve]].map(([icon, title, amount]) => (
                <span key={title}><img src={icon} alt="" /><span>{title}<b>{rub(amount)}</b></span></span>
              ))}
            </section>
            <MqxButton className="mqx-wide__events" variant="secondary" disabled={!events} onClick={() => setSheet('События')}>
              <img src={calendar} alt="" /> События · {events} осталось ›
            </MqxButton>
            <section className="mqx-wide__panel">
              <h2>Действия хода</h2>
              <MqxPeriodActions
                salaryHot={!claimed} salaryClaimed={claimed} salaryDisabled={claimed} salaryAmount={35000}
                onSalary={() => { record('Зарплата', 35000); setClaimed(true); }}
                onInvest={() => go('finance')}
                onContribute={() => setSheet('В подушку')}
                onWithdraw={() => setSheet('Из подушки')}
              />
            </section>
          </div>
          <aside className="mqx-wide__side">
            <div className="mqx-wide__close" aria-label="Завершение хода">
              <MqxButton variant="turn" onClick={() => setSheet('Завершить ход')}>Завершить ход <span aria-hidden="true">→</span></MqxButton>
              <p>Спишется <b>{rub(30000)}</b> · Останется <b>{rub(cash - 30000)}</b></p>
            </div>
            <div className="mqx-wide__panel"><MqxNeedsDash needs={needs} /></div>
            <section className="mqx-wide__panel mqx-wide__goal">
              <h2><span className="mqx-wide__target" aria-hidden="true" /> Цель сценария</h2>
              <p>Собрать подушку <b>{goal} из 5</b></p>
              <ol aria-label={'Прогресс цели: ' + goal + ' из 5'}>
                {[1, 2, 3, 4, 5].map((step) => <li key={step} data-step={step <= goal ? 'done' : step === goal + 1 ? 'next' : 'later'}>{step <= goal ? '✓' : step}</li>)}
              </ol>
              <footer>{goal === 5 ? 'Цель достигнута' : <>Следующий шаг: <b>внести деньги в подушку</b></>}</footer>
            </section>
            <section className="mqx-wide__panel">
              <h2><span aria-hidden="true">▤</span> Последние операции</h2>
              {history.slice(0, 2).map(([label, amount], index) => (
                <div className="mqx-wide__operation" key={index}><img src={amount > 0 ? coins : wallet} alt="" /><span>{label}</span><b data-gain={amount > 0}>{amount > 0 ? '+' : '−'}{rub(Math.abs(amount))}</b></div>
              ))}
              <button className="mqx-wide__link" onClick={() => setSheet('Вся история')}>Вся история →</button>
            </section>
          </aside>
        </main>}
        {tab === 'finance' && params.get('view') !== 'compact' && <MqxWideCapital />}
        {tab === 'finance' && params.get('view') === 'compact' && <MqxCapitalPreview desktopParty={{ cash, turn, positions,
          onInvest: (kind, amount) => {
            const principal = Number(amount);
            if (!(principal > 0 && principal <= cash)) return;
            const title = kind === 'deposit' ? 'Вклад' : 'Облигации';
            record(title, -principal);
            setPositions([...positions, { id: Math.max(0, ...positions.map((row) => row.id)) + 1, kind, title, principal, annual_rate_percent: kind === 'deposit' ? 14 : 16 }]);
          },
          onClose: (id) => {
            const position = positions.find((row) => row.id === id);
            if (!position) return;
            record('Возврат капитала', position.principal);
            setPositions(positions.filter((row) => row.id !== id));
          },
        }} />}
        {tab === 'analytics' && <MqxAnalyticsPage cash={cash} reserve={reserve} income={35000} expenses={30000} turn={turn}
          history={[3, 2, 1].map((offset) => ({ period_index: turn - offset, cash_balance: cash - offset * 5000, safety_fund_balance: reserve }))} />}
        {tab === 'menu' && <MqxMenuPage
          save={{ templateKey: 'mq_game_basic_v1', turn, persona: 'Студент', cash, goal: 'собрать подушку' }}
          savesHint="3 партии" onContinue={() => go('dashboard')}
          onNewGame={() => setNotice('Выбор персонажа доступен в игре')}
          onLoadGame={() => setNotice('Сохранения доступны в игре')}
          onLogout={() => setNotice('В превью используется тестовая партия')}
        />}
        {tab === 'menu' && <div role="status">{notice}</div>}
      </div>
      {sheet && <dialog ref={dialogRef} className="mqx-wide__dialog" aria-label={sheet} onCancel={() => setSheet(null)}>
        <h2>{sheet}</h2>
        {sheet === 'Вся история' ? <>
          {history.map(([label, amount], index) => <p key={index}>{label}: <b>{amount > 0 ? '+' : '−'}{rub(Math.abs(amount))}</b></p>)}
          <MqxButton variant="secondary" onClick={() => setSheet(null)}>Закрыть</MqxButton>
        </> : <>
        <p>{sheet === 'Завершить ход' ? 'Списание за ход: ' + rub(30000) :
          sheet === 'События' ? 'Подработка принесёт ' + rub(3000) : 'Сумма перевода: ' + rub(5000)}</p>
        <div className="mqx-wide__numbers">
          <MqxButton variant="secondary" onClick={() => setSheet(null)}>Отмена</MqxButton>
          <MqxButton variant="primary" onClick={confirm}
            disabled={sheet === 'В подушку' && cash < 5000 || sheet === 'Из подушки' && reserve < 5000}>Подтвердить</MqxButton>
        </div>
        </>}
      </dialog>}
    </div>
  );
}
