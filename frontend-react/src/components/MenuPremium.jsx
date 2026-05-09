import { Button } from '@telegram-apps/telegram-ui';

export function MenuPremium({ onLogout, onNewGame, onLoadGame }) {
  return (
    <div className="mqx-content">
      <div className="mqx-card">
        <div className="mqx-card__title">Меню</div>
        <div className="mqx-card__sub">Сценарий сессии и учётная запись.</div>

        <div className="mq-actions-stack" style={{ marginTop: 12 }}>
          <Button stretched mode="filled" onClick={onNewGame}>
            Новая игра
          </Button>
          <Button stretched mode="outline" onClick={onLoadGame}>
            Выбрать сохранение
          </Button>
          <Button stretched mode="plain" onClick={onLogout}>
            Выйти из аккаунта
          </Button>
        </div>
      </div>
    </div>
  );
}

