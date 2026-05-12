import { Button, Cell, Section } from '@telegram-apps/telegram-ui';

export function MenuSection({ onLogout, onNewGame, onLoadGame }) {
  return (
    <div className="mq-stack mq-stack-animate mq-stack--tight">
      <div className="mq-enter-item">
        <Section header="Меню">
          <div className="mq-slot-intro">Сценарий сессии и учётная запись — в том же коротком виде, что остальные вкладки игры.</div>
          <Cell multiline subtitle="Новая игра откроет мастер создания профиля из шапки приложения.">
            <div className="mq-actions-stack">
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
          </Cell>
        </Section>
      </div>
    </div>
  );
}