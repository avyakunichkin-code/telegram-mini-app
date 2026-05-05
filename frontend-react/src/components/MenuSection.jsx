import { Button, Cell, Section } from '@telegram-apps/telegram-ui';

export function MenuSection({ onLogout, onNewGame, onLoadGame }) {
  return (
    <Section header="Меню">
      <Cell>
        <Button stretched mode="filled" onClick={onNewGame}>Новая игра</Button>
      </Cell>
      <Cell>
        <Button stretched mode="outline" onClick={onLoadGame}>Загрузка</Button>
      </Cell>
      <Cell>
        <Button stretched mode="plain" onClick={onLogout}>Выйти из аккаунта</Button>
      </Cell>
    </Section>
  );
}