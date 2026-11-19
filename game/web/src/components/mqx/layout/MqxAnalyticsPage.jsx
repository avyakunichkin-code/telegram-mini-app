import { MonetkaAvatar } from '../brand/MonetkaAvatar';
import { BrandLogo } from '../../BrandLogo';
import { MoneyText } from '../../MoneyText';
import { MqxAnalyticsChart } from './MqxAnalyticsChart';
import { turnsPhrase } from '../utils/analyticsBoardDisplay';
import { BOND_ANNUAL_RATE_PERCENT, DEPOSIT_ANNUAL_RATE_PERCENT, investMonthlyAccrual } from '../../../constants/investProducts';
import '../../../styles/mqx/capital-pocket.css';
import '../../../styles/mqx/analytics-pocket.css';

function Rub({ value, largeAt = 1_000_000 }) {
  return <MoneyText value={value} decimals={0} className={Math.abs(value) >= largeAt ? 'analytics-large-amount' : ''} />;
}

export function AnalyticsRecommendation({ title, message, details, tone = 'guide' }) {
  return (
    <section className={`mqx-analytics-pocket__recommendation mqx-analytics-pocket__recommendation--${tone}`}>
      <MonetkaAvatar size={48} pose={tone === 'risk' ? 'worried' : 'think'} />
      <div className="mqx-analytics-pocket__speech">
        {title && <h2>{title}</h2>}
        {title ? <p>{message}</p> : message}
      </div>
      {details && <details><summary>Как начисляется доход</summary><p>{details}</p></details>}
    </section>
  );
}

export function AnalyticsForecastControls({ horizon, onChange }) {
  return (
    <div className="mqx-analytics-pocket__horizons" role="group" aria-label="Горизонт прогноза">
      {[3, 6, 12].map((value) => (
        <button key={value} type="button" aria-pressed={value === horizon} onClick={() => onChange(value)}>
          {turnsPhrase(value)}
        </button>
      ))}
    </div>
  );
}

export function MqxAnalyticsPage({
  cash, reserve, income, expenses, charges = expenses, turn, history, historyError, retry,
  recommendation, forecastControls, horizon, importantDecisions, children, an1Layout,
}) {
  const delta = income - expenses;
  const reserveTurns = expenses > 0 ? reserve / expenses : 0;
  const target = 3 * expenses;
  const shortfall = Math.max(0, Math.round((charges - cash) * 100) / 100);
  const canSave = Math.floor(Math.min(delta, cash - charges, target - reserve));
  const deficit = shortfall > 0 || delta < 0;
  const deposit = Math.max(0, Math.floor((reserve - target) / 2));
  const bonds = deposit;
  const leftInReserve = reserve - deposit - bonds;
  const gain = investMonthlyAccrual(deposit, DEPOSIT_ANNUAL_RATE_PERCENT)
    + investMonthlyAccrual(bonds, BOND_ANNUAL_RATE_PERCENT);
  const surplus = expenses > 0 && shortfall === 0 && delta >= 0 && gain > 0;
  const gameRecommendation = surplus ? <section>
        <h2 className="analytics-recommendation-title">Можно увеличить доход</h2>
        <p>Оставь <Rub value={target} /> в подушке. По <Rub value={deposit} /> можно направить во вклад и облигации.</p>
        <details className="analytics-calculation"><summary><strong>≈ +<Rub value={gain} /> за ход</strong><span>Посмотреть расчёт</span></summary>
          <p>Вклад под {DEPOSIT_ANNUAL_RATE_PERCENT}%: +<Rub value={investMonthlyAccrual(deposit, DEPOSIT_ANNUAL_RATE_PERCENT)} /> за ход. Облигации под {BOND_ANNUAL_RATE_PERCENT}%: +<Rub value={investMonthlyAccrual(bonds, BOND_ANNUAL_RATE_PERCENT)} /> за ход.</p>
          <p>На счёте останется <Rub value={cash} />, в подушке — <Rub value={leftInReserve} />. Прогноз ниже рассчитан для текущей партии.</p>
        </details>
      </section> : <section aria-live="polite">
        {deficit ? <>
          <h2>{shortfall > 0 ? "Не хватает на списание" : "Расходы выше доходов"}</h2>
          {shortfall > 0 && <p>До списания не хватает <MoneyText value={shortfall} decimals={Number.isInteger(shortfall) ? 0 : 2} />.{reserve >= shortfall ? " Столько можно перевести из подушки." : reserve > 0 ? " Подушка покроет только часть суммы." : ""}</p>}
          {delta < 0 && <p>Бюджет в минусе на <Rub value={-delta} /> за ход.</p>}
        </> : canSave > 0 && (reserve > 0 || turn > 1) ? <>
          <h2>Подушку можно пополнить</h2>
          <p>До запаса на три хода не хватает <Rub value={target - reserve} />. Сейчас можно отложить <Rub value={canSave} />, оставив деньги на списание.</p>
        </> : turn === 1 ? <>
          <h2>Первый ход</h2>
          <p>На счёте хватает на расходы. История появится после завершения хода.</p>
        </> : <><h2>Подушка на текущий ход</h2><p>Оставь на счёте деньги на ближайшее списание.</p></>}
      </section>;
  const recommendationContent = recommendation !== undefined ? recommendation : an1Layout
    ? <AnalyticsRecommendation
        title={surplus ? <>Можно вложить <Rub value={deposit + bonds} /></> : null}
        message={surplus ? <>В подушке останется <Rub value={leftInReserve} /> — на 3 хода расходов.</> : gameRecommendation.props.children}
        details={surplus && <>По <Rub value={deposit} /> во вклад и облигации. Ожидаемый доход — около <Rub value={gain} /> за ход.</>}
        tone={deficit ? 'risk' : 'guide'}
      />
    : gameRecommendation;
  return (
    <main className={`mqx-capital-pocket mqx-analytics-pocket${an1Layout ? " mqx-analytics-pocket--an1" : ""}`}>
      <header className="mqx-capital-pocket__heading">
        <BrandLogo variant="finance-game" />
        <h1>Аналитика</h1>
      </header>
      <section className="mqx-capital-pocket__board" aria-label="Счёт и подушка">
        <span className="mqx-capital-pocket__turn">Ход {String(turn).padStart(2, '0')}</span>
        <dl className="mqx-analytics-pocket__balances">
          <div><dt>На счёте</dt><dd><Rub value={cash} /></dd></div>
          <div><dt>В подушке</dt><dd><Rub value={reserve} /></dd><dd className="mqx-analytics-pocket__duration">{reserve <= 0 ? 'Подушки пока нет' : expenses <= 0 ? 'Трат за ход нет' : reserveTurns >= 99 ? 'на 99+ ходов' : 'на ' + turnsPhrase(reserveTurns)}</dd></div>
        </dl>
        {an1Layout && <div className={"mqx-analytics-pocket__net" + (delta < 0 ? " is-deficit" : delta === 0 ? " is-neutral" : "")}>
          <span>{delta < 0 ? 'Не хватает за ход' : delta === 0 ? 'Доходы равны расходам' : 'Остаётся за ход'}</span>
          <strong>{delta > 0 && '+'}<Rub value={delta} /></strong>
        </div>}
      </section>
      {an1Layout && <p className="mqx-analytics-pocket__flow-detail">Доходы <Rub value={income} /> · Расходы <Rub value={expenses} /></p>}
      {!an1Layout && recommendationContent}
      {!an1Layout && <section>
        <h2>Деньги за ход</h2>
        <dl className="mqx-analytics-pocket__flows">
          <div><dt>Доходы</dt><dd><Rub value={income} largeAt={100_000} /></dd></div>
          <div><dt>Расходы</dt><dd><Rub value={expenses} largeAt={100_000} /></dd></div>
          <div className={delta < 0 ? 'mqx-analytics-pocket__deficit' : undefined}><dt>{delta < 0 ? 'Не хватает' : 'Остаётся'}</dt><dd><Rub value={Math.abs(delta)} largeAt={100_000} /></dd></div>
        </dl>
      </section>}
      <section className={an1Layout ? 'mqx-analytics-pocket__forecast' : undefined}>
        <h2>Счёт + подушка</h2>
        {an1Layout && <>
          <dl className="mqx-analytics-pocket__forecast-totals">
            <div><dt>Сейчас</dt><dd><Rub value={cash + reserve} /></dd></div>
            <span aria-hidden="true">→</span>
            <div><dt>Через {turnsPhrase(horizon)}</dt><dd>≈<Rub value={cash + reserve + horizon * delta} /></dd></div>
          </dl>
          <p>Если доходы и расходы сохранятся</p>
        </>}
        {forecastControls}
        {historyError ? (
          <p role="status">{historyError} <button type="button" onClick={retry}>Повторить</button></p>
        ) : history == null ? (
          <p role="status">Загружаем историю…</p>
        ) : (
          <MqxAnalyticsChart turn={turn} total={cash + reserve} delta={delta} history={history} horizon={horizon} labLayout={an1Layout} />
        )}
      </section>
      {an1Layout && recommendationContent}
      {importantDecisions}
      {children}
    </main>
  );
}
