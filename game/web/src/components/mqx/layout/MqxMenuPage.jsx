import { MoneyText } from '../../MoneyText';
import { BrandLogo } from '../../BrandLogo';
import { PersonaPortrait } from '../brand/PersonaPortrait';
import '../../../styles/mqx/menu.css';
import { MqxButton } from '../primitives/MqxButton';
import coins from '../../../assets/actions/action-coins.png';
import savings from '../../../assets/actions/action-invest.png';

const Actions = [
  { id: 'new', label: 'Новая игра', art: coins },
  { id: 'saves', label: 'Все сохранения', art: savings },
];

export function MqxMenuPage({ save, savesHint, onContinue, onNewGame, onLoadGame, onLogout, onClaimGuest }) {
  const isStudent = save?.templateKey === 'mq_game_basic_v1';
  const handlers = { new: onNewGame, saves: onLoadGame };

  return (
    <main className="mqx-menu">
      <header className="mqx-menu__heading">
        <BrandLogo variant="finance-game" />
        <h1>Меню</h1>
      </header>

      {save && (
        <section className={isStudent ? "mqx-menu__save mqx-menu__save--student" : "mqx-menu__save"} aria-labelledby="mqx-menu-save-title">
          {!isStudent && save.templateKey && (
            <PersonaPortrait templateKey={save.templateKey} className="mqx-menu__portrait" />
          )}
          <div className="mqx-menu__save-copy">
            <span className="mqx-menu__turn">Ход {save.turn}</span>
            <h2 id="mqx-menu-save-title">{save.persona}</h2>
            <span>На счёте</span>
            <strong className="mqx-menu__balance"><MoneyText value={save.cash} decimals={0} /></strong>
            {save.goal && <p className="mqx-menu__goal">Цель: {save.goal}</p>}
          </div>
          <MqxButton variant="turn" type="button" className="mqx-menu__continue" onClick={onContinue}>
            Продолжить игру
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M3 12h17m-7-7 7 7-7 7" />
            </svg>
          </MqxButton>
        </section>
      )}

      <section className="mqx-menu__other" aria-labelledby="mqx-menu-other-title">
        <h2 id="mqx-menu-other-title">Другие партии</h2>
        <div className="mqx-menu__actions">
          {Actions.map(({ id, label, art }) => (
            <button key={id} type="button" className="mqx-menu__tile" onClick={handlers[id]}>
              <img src={art} alt="" />
              <span>
                <span className="mqx-menu__tile-label">{label}</span>
                {id === 'saves' && savesHint && <small>{savesHint}</small>}
              </span>
            </button>
          ))}
        </div>
      </section>

      {onClaimGuest && <MqxButton variant="secondary" onClick={onClaimGuest}>Сохранить игру в аккаунте</MqxButton>}
      <button type="button" className="mqx-menu__logout" onClick={onLogout}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M11 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h6M10 12h11m-4-4 4 4-4 4" />
        </svg>
        Выйти из аккаунта
      </button>
    </main>
  );
}
