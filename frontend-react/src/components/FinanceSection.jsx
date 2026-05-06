import { Button, Cell, Section, List } from '@telegram-apps/telegram-ui';
import { API } from '../api';
import { showNotification } from './notifications';

export function FinanceSection({ overview, refreshOverview }) {
  const handleDeleteLiability = async (id) => {
    try {
      await API.deleteLiability(id);
      await refreshOverview();
      showNotification('Обязательство удалено', 'success');
    } catch (err) {
      showNotification(err?.detail || err?.message || 'Ошибка соединения', 'error');
    }
  };

  const handleDeleteAsset = async (id) => {
    try {
      await API.deleteAsset(id);
      await refreshOverview();
      showNotification('Актив удалён', 'success');
    } catch (err) {
      showNotification(err?.detail || err?.message || 'Ошибка соединения', 'error');
    }
  };

  if (!overview) return null;

  return (
    <>
      <Section header="Обязательства">
        <List>
          {overview.liabilities.length === 0 && <Cell>Нет обязательств</Cell>}
          {overview.liabilities.map(liability => (
            <Cell key={liability.id} multiline after={
              <Button size="s" mode="destructive" onClick={() => handleDeleteLiability(liability.id)}>
                Удалить
              </Button>
            }>
              <div><strong>{liability.title}</strong></div>
              <div>Долг: {liability.total_debt.toFixed(2)} ₽</div>
              <div>Ставка: {liability.annual_rate_percent}%</div>
              <div>Платёж: {liability.monthly_payment.toFixed(2)} ₽</div>
            </Cell>
          ))}
        </List>
      </Section>
      <Section header="Активы">
        <List>
          {overview.assets.length === 0 && <Cell>Нет активов</Cell>}
          {overview.assets.map(asset => (
            <Cell key={asset.id} multiline after={
              <Button size="s" mode="destructive" onClick={() => handleDeleteAsset(asset.id)}>
                Удалить
              </Button>
            }>
              <div><strong>{asset.title}</strong></div>
              <div>Стоимость: {asset.asset_value.toFixed(2)} ₽</div>
              <div>Обслуживание: {asset.monthly_maintenance_cost.toFixed(2)} ₽</div>
            </Cell>
          ))}
        </List>
      </Section>
    </>
  );
}