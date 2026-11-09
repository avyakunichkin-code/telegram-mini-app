import { MoneyText } from '../../MoneyText';
import { periodCloseRitualPeriodLabel } from '../../../utils/periodCloseRitual';
import { PERIOD_CLOSE_SPAWN_FAILED_COPY, periodCloseEventsSpawnFailed } from '../../../utils/periodCloseDisplay';
import { formatPeriodMoney, periodCloseBalanceHeadline, periodCloseCompactLines } from '../../../utils/periodCloseBreakdown';

function signedMoney(value) {
  const n=Number(value)||0;
  return `${n>0?'+':n<0?'−':''}${formatPeriodMoney(n)} ₽`;
}

/** Approved compact A: whole-turn cash change and closing operations are distinct. */
export function MqxPeriodCloseRitual({ summary, open, onClose }) {
  if(!summary||!open)return null;
  const headline=periodCloseBalanceHeadline(summary);
  const lines=periodCloseCompactLines(summary);
  const overdue=Number(summary.overdue_added)||0;
  return <div className="mqx-juice-ritual-root mqx-juice-ritual-root--open mqx-close-clear-root" role="presentation">
    <section className="mqx-juice-ritual mqx-juice-ritual--active mqx-close-clear" role="dialog" aria-modal="true" aria-labelledby="mqx-juice-ritual-title">
      <div className="mqx-juice-ritual__scroll mqx-close-clear__scroll">
        <div className="mqx-close-clear__heading"><span aria-hidden="true">✓</span>{periodCloseRitualPeriodLabel(summary)}</div>
        <h2 id="mqx-juice-ritual-title" className="mqx-close-clear__title">Всё посчитано</h2>
        {headline?<>
          <div className="mqx-close-clear__balance" aria-label="Итог по счёту"><span>На счёте сейчас</span>
            <strong className={headline.balance<0?'mqx-close-clear__risk':undefined}><MoneyText value={headline.balance} decimals={0}/></strong></div>
          <p className="mqx-close-clear__whole-turn">За весь ход: <strong>{signedMoney(headline.delta)}</strong></p>
          {headline.balance<0?<p className="mqx-close-clear__notice mqx-close-clear__risk" role="note">Счёт ушёл в минус. Проверь расходы перед следующим закрытием.</p>:null}
        </>:null}
        {overdue>0?<p className="mqx-close-clear__notice mqx-close-clear__risk" role="note">Просрочка +<MoneyText value={overdue} decimals={0}/> — часть платежей осталась неоплаченной.</p>:null}
        {lines.length?<ul className="mqx-close-clear__operations" aria-label="Операции при закрытии">{lines.map(line=><li key={line.id}>
          <span>{line.title}{line.note?<small>{line.note}</small>:null}</span><strong>{line.tone==='income'?'+':'−'}<MoneyText value={line.amount} decimals={0}/></strong>
        </li>)}</ul>:null}
        {periodCloseEventsSpawnFailed(summary)?<p className="mqx-close-clear__notice" role="status">{PERIOD_CLOSE_SPAWN_FAILED_COPY}</p>:null}
        <details className="mqx-close-clear__details"><summary>Подробнее о ходе</summary>
          <p>Изменение счёта за весь ход включает зарплату, события и твои операции. Оно не равно списанию при закрытии.</p>
          <p>Проценты по вкладу остаются во вкладе. Купон облигаций поступает на счёт.</p>
          {Number(summary.safety_fund_delta)?<p>Изменение подушки: {signedMoney(summary.safety_fund_delta)}.</p>:null}
          {Number(summary.debt_delta)?<p>Изменение долгов: {signedMoney(summary.debt_delta)}.</p>:null}
        </details>
      </div>
      <div className="mqx-close-clear__footer"><button type="button" className="mqx-juice-ritual__dismiss" onClick={onClose}>Дальше</button></div>
    </section>
  </div>;
}
