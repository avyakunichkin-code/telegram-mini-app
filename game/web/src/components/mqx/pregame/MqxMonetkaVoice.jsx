import { MonetkaAvatar } from '../brand/MonetkaAvatar';

/**
 * Монетка в шапке ★ pregame-monetka-round, вариант B (PO 2026-11-02): Монетка 56 px без надписи,
 * реплика — h1 экрана вместо заголовка. Только экраны до выбора роли.
 */
export function MqxMonetkaVoice({ title, text, titleId }) {
  return (
    <header className="mqx-pg-voice">
      <MonetkaAvatar size={56} className="mqx-pg-voice__m" />
      <div>
        <h1 id={titleId} className="mqx-pg-voice__title">
          {title}
        </h1>
        {text ? <p className="mqx-pg-voice__text">{text}</p> : null}
      </div>
    </header>
  );
}
