import { Button, Cell, Modal, Section, List } from '@telegram-apps/telegram-ui';
import { showNotification } from './notifications';

export function EventModal({ event, open, onClose, onChoose }) {
  if (!event) return null;

  const handleChoose = async (choiceId) => {
    try {
      await onChoose(choiceId);
      showNotification('Выбор применён', 'success');
      onClose?.();
    } catch (e) {
      showNotification(e?.detail || e?.message || 'Не удалось применить выбор', 'error');
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Section header={`Событие • Период #${event.period_index}`}>
        <Cell multiline>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>{event.title}</div>
          <div style={{ opacity: 0.9 }}>{event.description}</div>
        </Cell>
        <List>
          {event.choices?.map((c) => (
            <Cell
              key={c.id}
              multiline
              after={
                <Button mode="filled" size="s" onClick={() => handleChoose(c.id)}>
                  Выбрать
                </Button>
              }
            >
              <div style={{ fontWeight: 600 }}>{c.title}</div>
              {c.description ? <div style={{ opacity: 0.8 }}>{c.description}</div> : null}
            </Cell>
          ))}
        </List>
        <Cell>
          <Button stretched mode="plain" onClick={onClose}>Закрыть</Button>
        </Cell>
      </Section>
    </Modal>
  );
}

