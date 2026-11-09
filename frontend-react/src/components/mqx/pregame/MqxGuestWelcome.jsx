import { BrandLogo } from '../../BrandLogo';
import student from '../../../assets/character-portraits/student-mascot.webp';

/** ★ Гостевой старт А, утверждён владельцем 07.11.2026. */
export function MqxGuestWelcome({ busy = false, error = '', returning = false, onStart, onLogin }) {
  return <main className="mqx-guest-welcome">
    <BrandLogo variant="full" className="mqx-guest-welcome__logo" />
    <div className="mqx-guest-welcome__scene" aria-hidden="true">
      <span className="mqx-guest-welcome__stamp">ТВОЯ ИСТОРИЯ<br />НАЧИНАЕТСЯ</span>
      <img src={student} alt="" />
      <span className="mqx-guest-welcome__coin">₽</span>
    </div>
    <div className="mqx-guest-welcome__copy">
      <small>ДЕНЬГИ. ВЫБОР. ПОСЛЕДСТВИЯ.</small>
      <h1>Твои решения.<br />Твой финансовый опыт.</h1>
      <p>Получай зарплату, планируй расходы и пробуй разные решения. Разбирайся в финансах через игру — без риска для настоящих денег.</p>
    </div>
    <div className="mqx-guest-welcome__actions">
      <button type="button" onClick={onStart} disabled={busy}>
        {busy ? 'Готовим твою партию…' : error ? 'Попробовать ещё раз' : returning ? 'Продолжить игру' : 'Начать играть'}
        {!busy && <span aria-hidden="true">→</span>}
      </button>
      <p>Без регистрации · прогресс сохраняется в этом браузере</p>
      {error && <p className="mqx-guest-welcome__error" role="alert">{error}</p>}
      <button type="button" className="mqx-guest-welcome__login" onClick={onLogin} disabled={busy}>Уже играл? Войти</button>
    </div>
  </main>;
}
