import { Button, Cell, Section } from '@telegram-apps/telegram-ui';

export function MenuSection({ onLogout, onNewGame, onLoadGame }) {
  return (
    <Section header="Меню">
      <Cell>
        <div className="mq-actions-stack">
          <Button stretched mode="filled" onClick={onNewGame}>Новая игра</Button>
          <Button stretched mode="outline" onClick={onLoadGame}>Загрузка</Button>
          <Button stretched mode="plain" onClick={onLogout}>Выйти из аккаунта</Button>
        </div>
      </Cell>
    </Section>
  );
}