import { useCallback, useEffect, useState } from 'react';
import { Button } from '@telegram-apps/telegram-ui';
import { API } from '../../../api';
import { showNotification } from '../../notifications';
import { MoneyText } from '../../MoneyText';
import { sanitizeIntInput, parseNumLoose } from '../../../utils/numberFields';
/**
 * In-game редактор статей расходов (только save_kind=plan).
 */
export function PlanExpenseEditor({ refreshOverview }) {
  const [lines, setLines] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [newCategory, setNewCategory] = useState('food');
  const [newAmountStr, setNewAmountStr] = useState('');
  const [newTitle, setNewTitle] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [cats, ln] = await Promise.all([
        API.listExpenseCategories(),
        API.listExpenseLines(),
      ]);
      setCategories(Array.isArray(cats) ? cats : []);
      setLines(Array.isArray(ln) ? ln : []);
    } catch (e) {
      showNotification(e?.detail || e?.message || 'Не удалось загрузить бюджет', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const total = lines.reduce((s, l) => s + (Number(l.amount_monthly) || 0), 0);

  const handlePatch = async (line, rawAmount) => {
    const amount = parseNumLoose(sanitizeIntInput(rawAmount), 0);
    if (amount === line.amount_monthly) return;
    setSaving(true);
    try {
      await API.patchExpenseLine(line.id, { amount_monthly: amount });
      await load();
      if (refreshOverview) await refreshOverview();
    } catch (e) {
      showNotification(e?.detail || e?.message || 'Не удалось сохранить', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (lineId) => {
    setSaving(true);
    try {
      await API.deleteExpenseLine(lineId);
      await load();
      if (refreshOverview) await refreshOverview();
    } catch (e) {
      showNotification(e?.detail || e?.message || 'Не удалось удалить', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleAdd = async () => {
    const amount = parseNumLoose(sanitizeIntInput(newAmountStr), 0);
    if (amount <= 0) {
      showNotification('Укажите сумму статьи', 'error');
      return;
    }
    setSaving(true);
    try {
      await API.createExpenseLine({
        category_key: newCategory,
        amount_monthly: amount,
        title: newTitle.trim() || undefined,
      });
      setNewAmountStr('');
      setNewTitle('');
      await load();
      if (refreshOverview) await refreshOverview();
    } catch (e) {
      showNotification(e?.detail || e?.message || 'Не удалось добавить', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <section className="mqx-card mqx-plan-expense-editor" aria-label="Редактор бюджета">
        <p className="mqx-plan-expense-editor__hint">Загрузка статей…</p>
      </section>
    );
  }

  const catOptions =
    categories.length > 0 ? categories : [{ category_key: 'food', title: 'Еда' }];

  return (
    <section className="mqx-card mqx-plan-expense-editor" aria-label="Редактор бюджета Plan">
      <div className="mqx-card__kicker mqx-card__kicker--amber">План</div>
      <h2 className="mqx-expenses-budget__title">Редактор расходов</h2>
      <p className="mqx-plan-expense-editor__hint">
        Изменения применяются сразу. Итого в месяц: <MoneyText value={total} decimals={0} />
      </p>

      <ul className="mqx-plan-expense-editor__lines-edit">
        {lines.map((line) => (
          <li key={line.id} className="mqx-plan-expense-editor__line-edit">
            <div className="mqx-plan-expense-editor__line-edit-meta">
              <span className="mqx-plan-expense-editor__line-edit-title">{line.title}</span>
              <span className="mqx-plan-expense-editor__line-edit-cat">{line.category_title}</span>
            </div>
            <input
              className="mq-field__input"
              inputMode="numeric"
              defaultValue={String(Math.round(line.amount_monthly))}
              disabled={saving}
              onBlur={(e) => handlePatch(line, e.target.value)}
            />
            <Button
              type="button"
              mode="destructive"
              size="s"
              disabled={saving}
              onClick={() => handleDelete(line.id)}
            >
              Удалить
            </Button>
          </li>
        ))}
      </ul>

      <div className="mqx-fin-subcard" style={{ marginTop: 14 }}>
        <div className="mqx-form">
          <label className="mq-field">
            <span className="mq-field__label">Категория</span>
            <select
              className="mq-field__input"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
            >
              {catOptions.map((c) => (
                <option key={c.category_key} value={c.category_key}>
                  {c.title}
                </option>
              ))}
            </select>
          </label>
          <label className="mq-field">
            <span className="mq-field__label">Сумма / мес (₽)</span>
            <input
              className="mq-field__input"
              inputMode="numeric"
              value={newAmountStr}
              onChange={(e) => setNewAmountStr(sanitizeIntInput(e.target.value))}
            />
          </label>
          <label className="mq-field">
            <span className="mq-field__label">Название (необязательно)</span>
            <input
              className="mq-field__input"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
            />
          </label>
        </div>
        <Button type="button" stretched mode="filled" size="s" disabled={saving} onClick={handleAdd}>
          + Добавить статью
        </Button>
      </div>
    </section>
  );
}
