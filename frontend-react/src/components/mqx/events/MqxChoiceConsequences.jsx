import { MoneyText } from '../../MoneyText';
import { EventChoiceImpacts } from './EventChoiceImpacts';

/** Approved B: present and conditional future cash are distinct, never summed. */
export function MqxChoiceConsequences({ choice }) {
  const impacts = Array.isArray(choice?.impacts) ? choice.impacts : [];
  const preview = choice?.future_payments;
  const payments = preview?.version === 1 && Array.isArray(preview.payments) ? preview.payments : [];
  const cash = impacts.filter(i => i.kind === 'cash');
  const burn = impacts.filter(i => i.kind === 'burn');
  const hasFuture = payments.length > 0;
  const cashNow = cash.reduce((sum, i) => sum + Number(i.delta || 0), 0);
  const rest = impacts.filter(i => !['cash', 'burn'].includes(i.kind) && !(hasFuture && i.kind === 'term'));
  return <>
    {(cash.length > 0 || (hasFuture && impacts.every(i => i.kind === 'term'))) && <span className="mqx-choice-money"><span>{cashNow > 0 ? 'На счёт сейчас' : 'Со счёта сейчас'}</span><strong>{cashNow > 0 ? '+' : ''}<MoneyText value={cashNow} decimals={0} /></strong></span>}
    {burn.map((i, index) => <span className="mqx-choice-money" key={`burn-${index}`}><span>Расходы за ход</span><strong>{Number(i.delta) > 0 ? '+' : ''}<MoneyText value={i.delta} decimals={0} /></strong></span>)}
    {payments.map((p, index) => <span className="mqx-choice-future" key={index}>
      <span className="mqx-choice-money"><span>Ход {p.period_index} · если выбрать</span><strong>{p.salary_fraction != null ? '≈ ' : ''}<MoneyText value={p.cash_delta} decimals={0} /></strong></span>
      <small>{(p.choice_path || []).join(' → ')}{p.salary_fraction != null ? ` · ${Math.round(p.salary_fraction * 100)}% зарплаты на ходе списания` : ''}</small>
    </span>)}
    {hasFuture && <small className="mqx-choice-note">Варианты одного хода альтернативны. Платежи одной ветки на разных ходах идут последовательно. Оценка по текущим условиям.</small>}
    {preview?.incomplete && <small className="mqx-choice-note">У продолжения есть дополнительные условия. Точная сумма пока неизвестна.</small>}
    <EventChoiceImpacts impacts={rest} needsDelta={choice?.needs_delta} />
  </>;
}
