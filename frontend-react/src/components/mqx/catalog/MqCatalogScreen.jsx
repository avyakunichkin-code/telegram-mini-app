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
  InvestPositionRow,
  LiabilityPositionMetrics,
  LiabilityTemplateMetrics,
  MetricInlineItem,
  MetricsRow,
  MqxButton,
  MqxChip,
  MqxDashStack,
  MqxDashboardHero,
  MqxSaveKindPicker,
  MqxStarterScenarioPicker,
  MqxDivider,
  MqxFinancePeriodBlock,
  MqxLevelDash,
  MqxPeriodActions,
  MqxPeriodCloseSheet,
  MqxPeriodChip,
  MqxPill,
  MqxProgress,
  MqxSubtab,
  MqxModeButton,
  MqxSectionSeg,
  MqxCapitalEmpty,
  MqxRowAction,
  MqxFinListRow,
  MqxConfirmDialog,
  useMqxConfirm,
  EventCard,
  OnboardingCoachDemo,
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
function RowActionsCatalogDemo() {
  const { confirm, dialog } = useMqxConfirm();
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <>
      {dialog}
      <p className="mqx-catalog__lead" style={{ marginTop: 0 }}>
        Канон: <strong>+</strong> / <strong>корзина</strong> по умолчанию (<code>MqxRowAction</code>); символ <strong>−</strong> —{' '}
        <code>removeVisual=&quot;minus&quot;</code>. Метрики: <code>coin | down | up | percent | term</code> — порядок и суммы без{' '}
        <code>/мес</code>, см. spec. Статика: <code>design-lab/row-actions/</code>.
      </p>
      <div className="mqx-fin-list" style={{ maxWidth: 420, marginTop: 12 }}>
        <MqxFinListRow
          title="Кредитная карта"
          metrics={
            <LiabilityPositionMetrics
              totalDebt={180000}
              monthlyPayment={9000}
              annualRatePercent={24}
              overdueAmount={4500}
            />
          }
          trailing={
            <MqxRowAction
              variant="remove"
              ariaLabel="Удалить долг"
              onClick={async () => {
                const ok = await confirm({
                  title: 'Удалить обязательство?',
                  message: '«Кредитная карта» будет закрыта.',
                });
                if (ok) setConfirmOpen(true);
              }}
            />
          }
        />
        <MqxFinListRow
          title="Квартира под сдачу"
          metrics={
            <AssetPositionMetrics assetValue={4200000} monthlyMaintenanceCost={12000} monthlyIncome={35000} />
          }
          trailing={<MqxRowAction variant="remove" ariaLabel="Удалить актив" onClick={() => {}} />}
        />
        <MqxFinListRow
          title="Вариант F1 — символ −"
          metrics={<AssetPositionMetrics assetValue={100000} monthlyMaintenanceCost={500} monthlyIncome={0} />}
          trailing={<MqxRowAction variant="remove" removeVisual="minus" ariaLabel="Удалить" onClick={() => {}} />}
        />
        <MqxFinListRow
          title="Шаблон: Ипотека"
          subtitle="Долг 3 200 000 ₽"
          trailing={<MqxRowAction variant="add" ariaLabel="Добавить" onClick={() => {}} />}
        />
      </div>
      <MqxConfirmDialog
        open={confirmOpen}
        title="Пример"
        message="Диалог после подтверждения в демо."
        onConfirm={() => setConfirmOpen(false)}
        onClose={() => setConfirmOpen(false)}
      />
    </>
  );
}

export function MqCatalogScreen() {
  const [amount, setAmount] = useState(120000);

  return (
    <div className="mqx-catalog app-shell mq-page" style={{ padding: 12 }}>
      <header className="mqx-catalog__header">
        <h1>MQX — библиотека компонентов</h1>
        <p className="mqx-catalog__lead">
          Только компоненты <strong>★ в production</strong>. Черновики и отклонённые варианты — в{' '}
          <code>design-lab/</code>, не здесь. Аудит:{' '}
          <code>docs/specs/UI_CONSISTENCY_AUDIT.md</code>.
        </p>
        <Link to="/" className="mqx-catalog__back">
          ← В игру
        </Link>
      </header>

      <CatalogSection title="Онбординг — Guided coach (O1 ★)">
        <OnboardingCoachDemo />
      </CatalogSection>

      <CatalogSection title="Новая игра — выбор режима (R1 ★)">
        <p className="mqx-catalog__lead">
          Шаг 1: <code>MqxSaveKindPicker</code> vivid (56/40, цветная полоска). План — «Скоро».
        </p>
        <div className="mqx-catalog-save-kind-demo">
          <MqxSaveKindPicker onSelectGame={() => {}} />
        </div>
      </CatalogSection>

      <CatalogSection title="Новая игра — сценарии (I-Scene ★)">
        <p className="mqx-catalog__lead">
          Шаг 2: <code>MqxStarterScenarioPicker</code> compact + иллюстрации 56/40. Профи — P-C.
        </p>
        <div style={{ maxWidth: 420 }}>
          <MqxStarterScenarioPicker
            layout="compact"
            value="mq_game_basic_v1"
            onChange={() => {}}
            templates={[
              {
                template_key: 'mq_game_basic_v1',
                title: 'Студент',
                difficulty_rank: 1,
                scenario_icon: 'fresh_start',
                highlights: ['Доход ~50 000 ₽/мес', 'Чистый старт — без долгов'],
              },
              {
                template_key: 'mq_game_tight_budget_v1',
                title: 'Профессионал',
                difficulty_rank: 2,
                scenario_icon: 'car_loan',
                highlights: ['Доход ~45 000 ₽/мес', 'Авто + потребительский кредит'],
              },
              {
                template_key: 'mq_game_mortgage_stress_v1',
                title: 'Руководитель',
                difficulty_rank: 3,
                scenario_icon: 'home_mortgage',
                highlights: ['Доход ~46 500 ₽/мес', 'Ипотека + авто'],
              },
              {
                template_key: 'mq_game_debt_stack_v1',
                title: 'Предприниматель',
                difficulty_rank: 4,
                scenario_icon: 'factory',
                highlights: ['Доход ~43 500 ₽/мес', 'Ипотека + кредитная карта'],
              },
            ]}
          />
        </div>
      </CatalogSection>

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

      <CatalogSection title="Shell — L3 (утверждённый дашборд)">
        <div style={{ maxWidth: 420 }}>
          <MqxDashStack>
            <MqxFinancePeriodBlock
              financeCards={[
                { title: 'Доходы', valueNode: <MoneyText value={3200} />, accent: 'mqx-accent--sky', valueTone: 'pos', icon: <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 19V5" /></svg> },
                {
                  title: 'Расходы',
                  valueNode: <MoneyText value={9600} />,
                  accent: 'mqx-accent--amber',
                  valueTone: 'out',
                  expenseIcon: true,
                  icon: (
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                      <path d="M3 6h18" />
                      <path d="M16 10a4 4 0 0 1-8 0" />
                    </svg>
                  ),
                },
                { title: 'Баланс', valueNode: <MoneyText value={42150} />, accent: 'mqx-accent--violet', icon: <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10V7a5 5 0 0 1 10 0v3" /></svg> },
                { title: 'Подушка', valueNode: <MoneyText value={18000} />, accent: 'mqx-accent--emerald', icon: <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 20 7v6c0 5" /></svg> },
              ]}
              onGoFinance={() => {}}
            />
            <MqxDivider />
            <MqxPeriodActions onSalary={() => {}} onContribute={() => {}} onWithdraw={() => {}} onInvest={() => {}} />
            <MqxDivider />
            <MqxLevelDash
              periodIndex={3}
              victory={{
                goals_met: 2,
                goals_required: 3,
                goals: [
                  { key: 'a', title: 'Подушка ≥ 3×', met: true, enabled: true, progress: 1 },
                  { key: 'b', title: 'Доходы ≥ 0', met: false, enabled: true, progress: 0.4 },
                  { key: 'c', title: 'Без просрочек', met: true, enabled: true, progress: 1 },
                ],
              }}
            />
          </MqxDashStack>
        </div>
      </CatalogSection>

      <CatalogSection title="Итог периода ★ (нижний лист)">
        <p className="mqx-catalog__lead" style={{ marginTop: 0 }}>
          <code>MqxPeriodCloseSheet</code> — 6 строк Δ, хвостик с периода 4. Lab: <code>design-lab/period-close/</code>.
        </p>
        <div style={{ maxWidth: 420, position: 'relative', minHeight: 280 }}>
          <MqxPeriodCloseSheet
            open
            onClose={() => {}}
            summary={{
              closed_period_index: 3,
              cash_delta: 1500,
              income_delta: 5000,
              expense_delta: -1200,
              safety_fund_delta: 10000,
              invest_capital_delta: 0,
              debt_delta: -8000,
              xp_earned: 32,
              xp_period_close: 22,
              xp_milestone: 0,
            }}
          />
        </div>
      </CatalogSection>

      <CatalogSection title="События ★ L3 — domain band + пузырь">
        <div className="mqx-stack" style={{ gap: 12, maxWidth: 420 }}>
          <MqxPill events badge={2}>
            События
          </MqxPill>
          <EventCard
            event={{
              id: 1,
              event_domain: 'auto',
              title: 'ДТП',
              description: 'Небольшое столкновение. При ОСАГО страховая покроет ущерб.',
              choices: [
                {
                  id: 10,
                  title: 'Оформить по полису ОСАГО',
                  description: 'Выплата по страховке',
                  insurance_claim: true,
                  impacts: [{ kind: 'insurance_payout', delta: 45000 }, { kind: 'xp', delta: 4 }],
                },
                {
                  id: 11,
                  title: 'Оплатить из своих',
                  impacts: [{ kind: 'cash', delta: -45000 }, { kind: 'xp', delta: 2 }],
                },
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
          <MetricInlineItem tip="Годовая ставка — получаем %" glyph="percent" tone="pos">
            12
          </MetricInlineItem>
          <MetricInlineItem tip="Годовая ставка — платим %" glyph="percent" tone="neg">
            18
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

      <CatalogSection title="Паттерны действий (+ / −, confirm)">
        <RowActionsCatalogDemo />
      </CatalogSection>

      <CatalogSection title="Сегмент раздела (MqxSectionSeg)">
        <p className="mqx-catalog__lead" style={{ marginTop: 0, marginBottom: 12 }}>
          Канон B на странице капитала: «Оформить / Добавить | Мои (N)» внутри карточки раздела.
        </p>
        <MqxSectionSeg mode="add" onModeChange={() => {}} addLabel="Добавить" mineLabel="Мои" mineCount={2} />
        <div style={{ marginTop: 12 }}>
          <MqxCapitalEmpty
            message="Нет позиций в этом разделе"
            actionLabel="Добавить из каталога"
            onAction={() => {}}
          />
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

      <CatalogSection title="Позиция актива (компактная строка)">
        <MqxFinListRow
          title="Квартира под сдачу"
          metrics={
            <AssetPositionMetrics assetValue={4200000} monthlyMaintenanceCost={12000} monthlyIncome={35000} />
          }
          trailing={<MqxRowAction variant="remove" ariaLabel="Удалить актив" onClick={() => {}} />}
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

      <CatalogSection title="Позиция долга (компактная строка)">
        <MqxFinListRow
          title="Кредитная карта"
          metrics={
            <LiabilityPositionMetrics
              totalDebt={180000}
              monthlyPayment={9000}
              annualRatePercent={24}
              overdueAmount={4500}
            />
          }
          trailing={<MqxRowAction variant="remove" ariaLabel="Удалить долг" onClick={() => {}} />}
        />
      </CatalogSection>

      <CatalogSection title="Позиция депозита">
        <InvestPositionRow
          position={{ id: 1, title: 'Депозит · 12 годовых', principal: 250000, annual_rate_percent: 12 }}
          onClose={() => {}}
        />
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
                title: 'Доходы ≥ 0',
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
