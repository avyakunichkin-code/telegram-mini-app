import { useState } from 'react';
import { Link } from 'react-router-dom';
import { roles, screens } from './startFlowData';
import { MoneyText } from '../../MoneyText';
import { BrandLogo } from '../../BrandLogo';
import { MqxButton } from '../primitives/MqxButton';
import { IconMetricCoins } from '../icons/FinanceMetricIcons';
import heroes from '../../../assets/start/welcome-heroes.png';
import { monetkaPoses } from '../brand/monetkaPoses';
import boardFooter from '../../../assets/start/board-footer.png';
import '../../../styles/mqx/start.css';

const LINE_ICONS = {
  person: 'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM4 21v-2a5 5 0 0 1 5-5h6a5 5 0 0 1 5 5v2Z',
  email: 'M3 5h18v14H3zM3 6l9 7 9-7',
  lock: 'M5 10h14v11H5zM8 10V7a4 4 0 0 1 8 0v3m-4 4v3',
  role: 'm2 9 10-5 10 5-10 5-10-5Zm4 2v5l6 3 6-3v-5',
  turn: 'm2 8 10-5 10 5-10 5-10-5Zm0 5 10 5 10-5M2 18l10 5 10-5',
};

function LineIcon({ name }) {
  return <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={LINE_ICONS[name]} /></svg>;
}

function Action({ children, variant = 'primary', icon, ...props }) {
  return (
    <MqxButton variant={variant} stretched {...props}>
      {icon && <span className={icon === '▶' ? 'start-lab__play' : 'start-lab__icon'} aria-hidden="true">{icon}</span>}
      {children}
    </MqxButton>
  );
}

function BackAction({ onClick }) {
  return <Action variant="secondary" className="start-lab__back" icon="←" onClick={onClick}>Назад</Action>;
}

function Portrait({ role, large = false }) {
  return (
    <div className={large ? 'start-lab__companion' : 'start-lab__portrait'} data-persona={role.id}>
      <img src={role.portrait} alt={large ? role.name : ''} />
    </div>
  );
}

export function MqxStartFlow({
  screen, role = roles[0], setRole, move, begin, onAuth, onLogout, onNewGame,
  onLoadGame, onStartRole, onEnterGame, onBack, onRetry, profiles = [],
  availableRoles = roles, loginLink = '?state=login', busy = false, error = '', live = false, footer,
}) {
  const [passwordError, setPasswordError] = useState(false);
  const registering = screen === 'register';
  return (
    <main className="start-lab">
      <section className="start-lab__screen" data-screen={screen} aria-label="Старт игры">
        <img className="start-lab__board" src={boardFooter} alt="" />
        <BrandLogo variant="full" className="start-lab__logo" />
        {screen === 'welcome' && <>
          <h1>Твои решения.<br />Твой финансовый<br />опыт</h1>
          <img className="start-lab__heroes" src={heroes} alt="" />
          <Action icon="▶" disabled={busy} onClick={begin}>Играть без аккаунта</Action>
          <Action disabled={busy} variant="secondary" icon={<LineIcon name="person" />} onClick={() => move('login')}>Войти</Action>
        </>}
        {(screen === 'login' || screen === 'register') && <>
          <form key={screen} className="start-lab__panel" onSubmit={(event) => {
            event.preventDefault();
            const fields = new FormData(event.currentTarget);
            if (registering && fields.get('password') !== fields.get('confirmation')) {
              setPasswordError(true);
              return;
            }
            onAuth({
              email: String(fields.get('email') || '').trim().toLowerCase(),
              password: fields.get('password'),
              password_confirm: fields.get('confirmation'),
            });
          }}>
            <h1>{screens[screen]}</h1>
            <label><span><LineIcon name="email" /></span><input type="email" name="email" aria-label="Почта" placeholder="Почта" autoComplete="off" required={registering || live} /></label>
            <label><span><LineIcon name="lock" /></span><input type="password" name="password" minLength={registering && live ? 6 : undefined} maxLength={128} aria-label="Пароль" placeholder="Пароль" autoComplete={registering ? 'new-password' : 'current-password'} required={registering || live} onChange={() => setPasswordError(false)} /></label>
            {registering && (
              <label><span><LineIcon name="lock" /></span><input type="password" name="confirmation" aria-label="Повтори пароль" placeholder="Повтори пароль" autoComplete="new-password" required onChange={() => setPasswordError(false)} aria-invalid={passwordError} aria-describedby={passwordError ? 'start-lab-password-error' : undefined} /></label>
            )}
            {registering && passwordError && <p id="start-lab-password-error" className="start-lab__error" role="alert">Пароли не совпадают</p>}
            <Action type="submit" disabled={busy}>{registering ? 'Создать аккаунт' : 'Войти'}</Action>
            {registering
              ? <Link className="start-lab__login-link" to={loginLink} onClick={() => setPasswordError(false)}>Уже есть аккаунт</Link>
              : <Action variant="secondary" onClick={() => { setPasswordError(false); move('register'); }}>Создать аккаунт</Action>}
          </form>
          <img className="start-lab__coin" src={monetkaPoses.welcome} alt="" />
          <BackAction onClick={onBack} />
        </>}
        {screen === 'empty' && <>
          <div className="start-lab__stub" aria-hidden="true">
            <svg viewBox="0 0 64 40" width="68" height="44">
              <path fill="currentColor" d="M17 3h30c6 0 10 5 12 12l3 12c2 9-5 14-12 9l-9-7H23l-9 7C7 41 0 36 2 27l3-12C7 8 11 3 17 3Z" />
              <path d="M16 17h12m-6-6v12" stroke="#ead6f0" strokeWidth="3" strokeLinecap="round" />
              <g fill="#ead6f0"><circle cx="43" cy="14" r="2.5"/><circle cx="50" cy="19" r="2.5"/></g>
            </svg>
          </div>
          <h1>Сохранений<br />пока нет</h1>
          <p>Начни новую игру и пройди свой финансовый путь</p>
          <Action icon="▶" disabled={busy} onClick={onNewGame}>Новая игра</Action>
          <Action variant="link" onClick={onLogout}>Выйти из аккаунта</Action>
        </>}
        {(screen === 'saved' || screen === 'returning' || screen === 'saves') && <>
          {screen !== 'saved' && <h1>{screen === 'saves' ? 'Все сохранения' : 'Продолжить партию'}</h1>}
          {profiles.map((profile) => {
            const persona = roles.find((item) => item.templateKey === profile.starter_template_key);
            return <div className="start-lab__save" key={profile.id}>
              <article className="start-lab__ticket">
                {persona ? <Portrait role={persona} /> : <span aria-hidden="true" />}
                <div>
                  {screen === 'saved' ? <h1>{profile.name}</h1> : <h2>{profile.name}</h2>}
                  <p className="start-lab__metadata">
                    <span><LineIcon name="role" />{persona?.name || 'Игрок'}</span>
                    <span><LineIcon name="turn" />Ход {profile.period_index}</span>
                    <strong><IconMetricCoins size={19} /><MoneyText value={profile.cash_balance} decimals={0} /></strong>
                  </p>
                </div>
              </article>
              <Action disabled={busy} icon="▶" onClick={() => onLoadGame(profile)}>Продолжить игру</Action>
            </div>;
          })}
          {screen === 'saved' && <>
            <Action variant="secondary" icon="＋" onClick={onNewGame}>Новая игра</Action>
            <Action variant="secondary" icon="☷" onClick={() => move('saves')}>Все сохранения</Action>
          </>}
          {screen === 'saves' && <BackAction onClick={onBack} />}
          {screen === 'saved' && <Action variant="link" onClick={onLogout}>Выйти из аккаунта</Action>}
        </>}
        {screen === 'roles' && <>
          <h1>Выбери жизнь</h1>
          <p>Пройди финансовый путь в одной из ролей — у каждой свои вызовы, возможности и цели.</p>
          <div className="start-lab__roles" role="group" aria-label="Роль">
            {availableRoles.map((item) => (
              <MqxButton key={item.name} variant="secondary" aria-pressed={role === item} onClick={() => setRole(item)}>
                <Portrait role={item} />
                {item.name}
              </MqxButton>
            ))}
          </div>
          <Action icon="▶" disabled={busy} onClick={() => onStartRole(role)}>Начать за {role.label}</Action>
          <BackAction onClick={onBack} />
        </>}
        {screen === 'intro' && <>
          <Portrait role={role} large />
          <div className="start-lab__panel start-lab__intro">
            <img src={monetkaPoses.welcome} alt="" />
            <h1>Твой напарник</h1>
            <p>Привет! Помогу разобраться с первыми финансовыми решениями.</p>
          </div>
          <Action icon="▶" onClick={onEnterGame}>Начать первый ход</Action>
        </>}
        {screen === 'loading' && <h1 role="status">Загрузка…</h1>}
        {screen === 'unavailable' && <>
          <Action onClick={onRetry}>Повторить</Action>
          <BackAction onClick={onBack} />
        </>}
        {error && <p className="start-lab__error" role="alert">{error}</p>}
        {screen === 'game' && <>
          <h1>Переход к партии</h1>
          <Action variant="secondary" onClick={() => move('welcome')}>К началу превью</Action>
        </>}
      </section>
      {footer}
    </main>
  );
}
