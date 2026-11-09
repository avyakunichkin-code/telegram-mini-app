import coin from '../../../assets/guides/coin-welcome-avatar.webp';

export function MqxGuestClaim({ onCreate, onContinue }) {
  return <section className="mqx-guest-claim" aria-labelledby="guest-claim-title">
    <img src={coin} alt="" />
    <h2 id="guest-claim-title">Сохраним твою историю?</h2>
    <p>Привяжи почту, чтобы продолжать на другом устройстве. Партия и все решения останутся с тобой.</p>
    <button type="button" onClick={onCreate}>Создать аккаунт</button>
    <button type="button" className="mqx-guest-claim__later" onClick={onContinue}>Продолжить без регистрации →</button>
    <small>Без аккаунта возврат в игру доступен в этом браузере. Если удалить его данные, доступ может потеряться.</small>
  </section>;
}
