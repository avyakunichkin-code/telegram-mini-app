import { Button } from '@telegram-apps/telegram-ui';
import { MqxTabHero } from './MqxTabHero';

export function MenuPremium({ onLogout, onNewGame, onLoadGame }) {
  return (
    <div className="mqx-tab-page">
      <MqxTabHero
        sectionLabel="Сессия"
        rightPill="Меню"
        title="Игра на паузе"
        subtitle="Смена сохранения, новый профиль или выход — в том же каркасе, что вкладки игры."
      />
      <main className="mqx-content mqx-tab-page__scroll">
        <div className="mqx-card">
          <div className="mqx-card__kicker mqx-card__kicker--violet">Действия</div>
          <div className="mqx-card__title">Сценарий</div>
          <div className="mqx-card__sub">Те же кнопки, что на стартовом экране, без смены визуального языка.</div>

          <div className="mq-actions-stack" style={{ marginTop: 14 }}>
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
      </main>
    </div>
  );
}
