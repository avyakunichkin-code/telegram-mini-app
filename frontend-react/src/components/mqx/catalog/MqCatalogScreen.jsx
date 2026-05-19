import { useState } from 'react';
import { Link } from 'react-router-dom';
import { InvestProductForm } from '../../InvestProductForm';
import { InvestRateChip } from '../../InvestRateChip';
import {
  AssetPositionMetrics,
  AssetTemplateMetrics,
  CapitalPositionCard,
  IconMetricCoins,
  IconMetricPercent,
  IconMetricTerm,
  IconMetricTrendDown,
  IconMetricTrendUp,
  InsurancePlanCard,
  InsurancePlanMetrics,
  InsurancePolicyMetrics,
  InsurancePolicyRow,
  InsuranceProductPicker,
  InsuranceSection,
  VictoryGoalsPanel,
  InvestPositionMetrics,
  LiabilityPositionMetrics,
  LiabilityTemplateMetrics,
  MetricInlineItem,
  MetricsRow,
  MqxBlockSection,
  MqxButton,
  MqxCard,
  MqxCardHeader,
  MqxChip,
  MqxDashStack,
  MqxDashboardHero,
  MqxDivider,
  MqxGoalBadge,
  MqxLevelBlock,
  MqxPeriodActions,
  MqxPeriodChip,
  MqxPeriodDashboard,
  MqxPill,
  MqxProgress,
  MqxStatMini,
  MqxSubtab,
  MqxModeButton,
  EventCard,
} from '../index';
import { MoneyText } from '../../MoneyText';
import { INSURANCE_PLANS } from '../../../constants/insuranceProducts';

const DEMO_POLICY = {
  id: 1,
  kind: 'auto_liability',
  product: 'auto',
  title: 'ОСАГО — Стандарт',
  monthly_premium: 2400,
  payout_amount: 400000,
  term_periods: 12,
  started_period_index: 3,
  expires_period_index: 15,
};

const DEMO_PLAN = INSURANCE_PLANS.find((p) => p.plan_key === 'auto_liability_standard') ?? INSURANCE_PLANS[0];

function CatalogSection({ title, children }) {
  return (
    <section className="mqx-catalog-section">
      <h2 className="mqx-catalog-section__title">{title}</h2>
      {children}
    </section>
  );
}

/** Витрина MQX-компонентов (только dev: #/dev/mqx). */
export function MqCatalogScreen() {
  const [amount, setAmount] = useState(120000);

  return (
    <div className="mqx-catalog app-shell mq-page" style={{ padding: 12 }}>
      <header className="mqx-catalog__header">
        <h1>MQX — библиотека компонентов</h1>
        <p className="mqx-catalog__lead">
          Живой каталог стандартизированных блоков Money Quest. Статичные эксперименты — в{' '}
          <code>design-lab/</code>.
        </p>
        <Link to="/" className="mqx-catalog__back">
          ← В игру
        </Link>
      </header>

      <CatalogSection title="Hero — H3′ compact (дашборд)">
        <div style={{ maxWidth: 420, borderRadius: 16, overflow: 'hidden' }}>
          <MqxDashboardHero
            periodIndex={4}
            timerLabel="Прогресс месяца"
            timerValue="08:42"
            periodDurationSeconds={600}
            remainingSeconds={348}
            canPlay
            canPause={false}
            onPlay={() => {}}
            onPause={() => {}}
            onNextPeriod={() => {}}
            pendingEventsCount={2}
            onOpenEvents={() => {}}
          />
        </div>
      </CatalogSection>

      <CatalogSection title="Shell — D′ flat (утверждённый дашборд)">
        <div style={{ maxWidth: 420 }}>
          <MqxDashStack>
            <MqxLevelBlock
              level={3}
              xp={45}
              xpNeed={100}
              xpFrac={0.45}
              score={1240}
              bars={[
                { label: 'Доход', value: 50000, frac: 1, tone: 'mqx-bar--emerald' },
                { label: 'Долги', value: 12000, frac: 0.24, tone: 'mqx-bar--rose' },
              ]}
            />
            <MqxDivider />
            <MqxPeriodDashboard
              victory={{
                goals_met: 2,
                goals_required: 3,
                goals: [
                  { key: 'a', title: 'Подушка ≥ 3×', met: true, enabled: true, progress: 1 },
                  { key: 'b', title: 'Поток ≥ 0', met: false, enabled: true, progress: 0.4 },
                ],
              }}
              financeCards={[
                { title: 'Баланс', valueNode: <MoneyText value={42150} />, accent: 'mqx-accent--violet', icon: <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10V7a5 5 0 0 1 10 0v3" /></svg> },
                { title: 'Подушка', valueNode: <MoneyText value={18000} />, accent: 'mqx-accent--emerald', icon: <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 20 7v6c0 5" /></svg> },
                { title: 'Поток', valueNode: <MoneyText value={3200} />, accent: 'mqx-accent--sky', icon: <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 19V5" /></svg> },
                { title: 'Расходы', valueNode: <MoneyText value={9600} />, accent: 'mqx-accent--amber', icon: <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 19V5" /></svg> },
              ]}
              onGoFinance={() => {}}
            />
            <MqxDivider />
            <MqxPeriodActions onSalary={() => {}} onContribute={() => {}} onWithdraw={() => {}} onInvest={() => {}} />
          </MqxDashStack>
        </div>
      </CatalogSection>

      <CatalogSection title="Shell — legacy карточки">
        <div className="mqx-stack" style={{ gap: 12, maxWidth: 420 }}>
          <MqxCard variant="goal">
            <MqxCardHeader
              layout="split"
              kicker="Цель"
              kickerTone="emerald"
              title="Победа в сценарии"
              sub="2 из 3 целей"
              trailing={<MqxGoalBadge>Почти</MqxGoalBadge>}
            />
          </MqxCard>
          <MqxBlockSection title="Финансы" actionLabel="Детали" onAction={() => {}}>
            <div className="mqx-grid2">
              <MqxStatMini
                title="Баланс"
                accent="mqx-accent--violet"
                value={<MoneyText value={42000} />}
                icon={(
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M7 10V7a5 5 0 0 1 10 0v3" />
                  </svg>
                )}
              />
              <MqxStatMini
                title="Подушка"
                accent="mqx-accent--emerald"
                value={<MoneyText value={18000} />}
                icon={(
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 3 20 7v6c0 5-3.4 8.2-8 9-4.6-.8-8-4-8-9V7l8-4Z" />
                  </svg>
                )}
              />
            </div>
          </MqxBlockSection>
        </div>
      </CatalogSection>

      <CatalogSection title="События — B′ flat + страховой случай">
        <div className="mqx-stack" style={{ gap: 12, maxWidth: 420 }}>
          <MqxPill events badge={2}>
            События
          </MqxPill>
          <EventCard
            event={{
              id: 1,
              period_index: 4,
              title: 'ДТП',
              description: 'Небольшое столкновение. При ОСАГО страховая покроет ущерб.',
              idxInDeck: 0,
              deckLen: 2,
              choices: [
                { id: 10, title: 'Оформить по полису ОСАГО', description: 'Выплата по страховке', insurance_claim: true, xp_delta: 4 },
                { id: 11, title: 'Оплатить из своих (−45 000 ₽)', xp_delta: 2 },
                { id: 12, title: 'Договориться без оформления', xp_delta: 1 },
              ],
            }}
            busyId={null}
            onPick={() => {}}
          />
          <p className="mqx-catalog__note">
            Полный оверлей: <code>EventCarouselOverlay</code> в игре (карусель + свайп).
          </p>
        </div>
      </CatalogSection>

      <CatalogSection title="Иконки метрик">
        <div className="mqx-catalog-glyphs">
          <span className="mqx-metric-glyph mqx-metric-glyph--coin">
            <IconMetricCoins />
          </span>
          <span className="mqx-metric-glyph mqx-metric-glyph--down">
            <IconMetricTrendDown />
          </span>
          <span className="mqx-metric-glyph mqx-metric-glyph--up">
            <IconMetricTrendUp />
          </span>
          <span className="mqx-metric-glyph mqx-metric-glyph--percent mqx-metric-glyph--pos">
            <IconMetricPercent />
          </span>
          <span className="mqx-metric-glyph mqx-metric-glyph--percent mqx-metric-glyph--neg">
            <IconMetricPercent />
          </span>
          <span className="mqx-metric-glyph mqx-metric-glyph--term">
            <IconMetricTerm />
          </span>
        </div>
      </CatalogSection>

      <CatalogSection title="Страховки — метрики (asset H)">
        <InsurancePlanMetrics monthlyPremium={2400} payoutAmount={400000} termPeriods={12} />
        <div style={{ marginTop: 10 }}>
          <InsurancePolicyMetrics policy={DEMO_POLICY} />
        </div>
      </CatalogSection>

      <CatalogSection title="Страховки — тариф (InsurancePlanCard)">
        <InsurancePlanCard plan={DEMO_PLAN} onBuy={() => {}} />
      </CatalogSection>

      <CatalogSection title="Страховки — активный полис (InsurancePolicyRow)">
        <InsurancePolicyRow policy={DEMO_POLICY} onCancel={() => {}} />
      </CatalogSection>

      <CatalogSection title="Страховки — блок (InsuranceProductPicker)">
        <InsuranceProductPicker onBuy={() => {}} />
      </CatalogSection>

      <CatalogSection title="Страховки — экран (InsuranceSection)">
        <InsuranceSection
          policies={[DEMO_POLICY]}
          onBuy={() => {}}
          onCancel={() => {}}
          intro={null}
        />
      </CatalogSection>

      <CatalogSection title="MetricInlineItem">
        <MetricsRow>
          <MetricInlineItem tip="Стоимость" glyph="coin">
            4 200 000 ₽
          </MetricInlineItem>
          <MetricInlineItem tip="Расход" glyph="down" tone="neg">
            12 000
          </MetricInlineItem>
          <MetricInlineItem tip="Доход" glyph="up" tone="pos">
            35 000
          </MetricInlineItem>
          <MetricInlineItem tip="Ставка (получаем)" glyph="percent" tone="pos">
            12%
          </MetricInlineItem>
          <MetricInlineItem tip="Ставка (платим)" glyph="percent" tone="neg">
            18%
          </MetricInlineItem>
        </MetricsRow>
      </CatalogSection>

      <CatalogSection title="Примитивы (D + C + B/A)">
        <p className="mqx-catalog__lead" style={{ marginTop: 0 }}>
          Размеры D · шрифты 15/13px (C) · прогресс 6px · emerald-градиент цели · sky-градиент XP.
        </p>
        <div
          style={{
            marginTop: 12,
            padding: 14,
            borderRadius: 16,
            background: 'linear-gradient(135deg, #6d28d9 0%, #5b21b6 52%, #4338ca 100%)',
          }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
            <MqxButton variant="hero-filled">Пауза</MqxButton>
            <MqxButton variant="hero-outline">След. месяц</MqxButton>
            <MqxPeriodChip value="#3" />
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
            <MqxPill events badge={2}>
              События
            </MqxPill>
            <MqxPill>Аналитика</MqxPill>
          </div>
        </div>
        <div style={{ maxWidth: 360, marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <MqxButton variant="primary">Активы</MqxButton>
          <MqxButton variant="secondary">Долги</MqxButton>
        </div>
        <div
          style={{
            maxWidth: 360,
            marginTop: 12,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <MqxChip xp>+120 XP</MqxChip>
          <span style={{ fontSize: 13, opacity: 0.65 }}>Ур. 4 → 5</span>
        </div>
        <div style={{ maxWidth: 360, marginTop: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.55, marginBottom: 4 }}>Цель</div>
          <MqxProgress value={62} aria-label="Прогресс цели" />
          <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.55, margin: '10px 0 4px' }}>XP</div>
          <MqxProgress value={62} xp aria-label="Прогресс опыта" />
        </div>
      </CatalogSection>

      <CatalogSection title="Кнопки и вкладки">
        <div className="mqx-fin-subtabs-row" style={{ maxWidth: 360 }}>
          <MqxSubtab active>Активные</MqxSubtab>
          <MqxSubtab>В рамке</MqxSubtab>
        </div>
        <div className="mqx-capital-mode-grid" style={{ maxWidth: 360, marginTop: 12 }}>
          <MqxModeButton active>Режим вкл</MqxModeButton>
          <MqxModeButton>Режим выкл</MqxModeButton>
        </div>
      </CatalogSection>

      <CatalogSection title="Шаблон актива">
        <CapitalPositionCard
          variant="asset"
          kicker="Недвижимость"
          title="Квартира под сдачу"
          metrics={
            <AssetTemplateMetrics assetValue={4200000} monthlyMaintenanceCost={12000} monthlyIncome={35000} />
          }
          action={{ className: 'mqx-fin-icon-btn mqx-fin-icon-btn--plus mqx-capital-add-btn', onClick: () => {} }}
          actionLabel="+"
          actionAriaLabel="Добавить"
        />
      </CatalogSection>

      <CatalogSection title="Позиция актива">
        <CapitalPositionCard
          variant="asset"
          kicker="Недвижимость"
          title="Квартира под сдачу"
          metrics={
            <AssetPositionMetrics assetValue={4200000} monthlyMaintenanceCost={12000} monthlyIncome={35000} />
          }
          action={{ className: 'mqx-capital-delete-btn', onClick: () => {} }}
          actionLabel="Удалить"
        />
      </CatalogSection>

      <CatalogSection title="Шаблон долга">
        <CapitalPositionCard
          variant="liability"
          kicker="Долг"
          title="Ипотека"
          metrics={
            <LiabilityTemplateMetrics totalDebt={3200000} monthlyPayment={42000} annualRatePercent={12} />
          }
          action={{ className: 'mqx-fin-icon-btn mqx-fin-icon-btn--plus mqx-capital-add-btn', onClick: () => {} }}
          actionLabel="+"
        />
      </CatalogSection>

      <CatalogSection title="Позиция долга">
        <CapitalPositionCard
          variant="liability"
          kicker="Долг"
          title="Кредитная карта"
          metrics={
            <LiabilityPositionMetrics
              totalDebt={180000}
              monthlyPayment={9000}
              annualRatePercent={24}
              overdueAmount={4500}
            />
          }
          action={{ className: 'mqx-capital-delete-btn', onClick: () => {} }}
          actionLabel="Удалить"
        />
      </CatalogSection>

      <CatalogSection title="Позиция депозита">
        <div className="mqx-fin-row mqx-fin-row--positions mqx-fin-row--invest-pos" style={{ maxWidth: 420 }}>
          <div className="mqx-fin-row__l">
            <div className="mqx-fin-row__title">Депозит 12% годовых</div>
            <InvestPositionMetrics principal={250000} annualRatePercent={12} rateTone="pos" />
          </div>
          <button type="button" className="mqx-fin-icon-btn mqx-fin-icon-btn--minus">
            −
          </button>
        </div>
      </CatalogSection>

      <CatalogSection title="Цели победы (Victory v2)">
        <VictoryGoalsPanel
          victory={{
            goals_met: 2,
            goals_required: 3,
            period_gate_open: true,
            win_reached: false,
            min_period_index: 7,
            goals: [
              {
                key: 'safety_3x',
                type: 'safety_fund_months',
                title: 'Подушка ≥ 3× обязательств',
                met: true,
                enabled: true,
                progress: 1,
                detail: { current: 90000, target: 60000 },
              },
              {
                key: 'no_overdue',
                type: 'no_overdue',
                title: 'Без просрочек',
                met: true,
                enabled: true,
                progress: 1,
                detail: { total_overdue_amount: 0 },
              },
              {
                key: 'cashflow',
                type: 'net_monthly_cashflow_nonneg',
                title: 'Поток ≥ 0',
                met: false,
                enabled: true,
                progress: 0.4,
                detail: { net_monthly_cashflow: -2000 },
              },
            ],
          }}
          legacyGoal={{ target: 60000, current: 40000, frac: 0.67, win: false, ready: false }}
        />
      </CatalogSection>

      <CatalogSection title="Форма депозита (variant D)">
        <InvestRateChip annualRatePercent={12} productId="deposit" />
        <InvestProductForm
          productId="deposit"
          amount={amount}
          maxCash={420000}
          annualRatePercent={12}
          onAmountChange={setAmount}
          onSubmit={() => {}}
          submitLabel="Открыть депозит"
        />
      </CatalogSection>
    </div>
  );
}
