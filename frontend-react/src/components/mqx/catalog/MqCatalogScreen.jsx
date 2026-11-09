import { useState } from 'react';
import { Link } from 'react-router-dom';
import { InvestProductForm } from '../../InvestProductForm';
import {
  AssetPositionMetrics,
  AssetTemplateMetrics,
  CapitalPositionCard,
  IconMetricCoins,
  IconMetricGoal,
  IconMetricPercent,
  IconMetricShield,
  IconMetricTerm,
  IconMetricTrash,
  IconMetricTrendDown,
  IconMetricTrendUp,
  IconMetricWallet,
  IconMetricWarn,
  InsurancePlanCard,
  InsurancePlanMetrics,
  InsurancePolicyMetrics,
  InsurancePolicyRow,
  InsuranceProductPicker,
  InsuranceSection,
  MqxGoalDash,
  InvestPositionMetrics,
  InvestPositionRow,
  LiabilityPositionMetrics,
  LiabilityTemplateMetrics,
  MetricInlineItem,
  MetricsRow,
  MqxButton,
  MqxStarterScenarioPicker,
  MqxSaveCard,
  MqxBoardButton,
  MqxFinancePeriodBlock,
  MqxPeriodCloseSheet,
  MqxPill,
  MqxSubtab,
  MqxModeButton,
  MqxRowAction,
  MqxFinListRow,
  EventCard,
  MqxGuidanceStripDemo,
  MqxJuiceCatalogDemo,
} from '../index';
import { MqxStatesCatalogDemo } from './MqxStatesCatalogDemo';
import { MqxEventsTailsCatalogDemo } from './MqxEventsTailsCatalogDemo';
import { MqxRunFinaleCatalogDemo } from './MqxRunFinaleCatalogDemo';
import { MqxFirstInvestmentDemo } from './MqxFirstInvestmentDemo';
import { MqxPlaytestSurveyDemo } from './MqxPlaytestSurveyDemo';
import { MqxMascotsCatalogDemo } from './MqxMascotsCatalogDemo';
import { CATALOG_LEGACY_GOAL_DEMO, CATALOG_VICTORY_DEMO } from './catalogVictoryDemo';
import { CATALOG_EVENTS_L3_BASELINE } from './catalogEventsDemo';
import { CATALOG_INSURANCE_POLICY, catalogInsurancePlan } from './catalogInsuranceDemo';
import { CATALOG_PERIOD_CLOSE_SHEET } from './catalogStatesDemo';
import { CurrentPrimitivesDemo, CurrentRowActionsDemo, CurrentSectionSegDemo, CurrentDashboardDemo } from './MqxCurrentCatalogDemos';
import { MqxPlayerDecisionsDemo } from './MqxPlayerDecisionsDemo';
import { MqxPocketBoardDemo } from './MqxPocketBoardDemo';
import { MqxGuestWelcome } from '../pregame/MqxGuestWelcome';
import { MqxGuestClaim } from '../pregame/MqxGuestClaim';

const CATALOG_INSURANCE_PLAN = catalogInsurancePlan();

function CatalogSection({ title, children, context = 'field' }) {
  return (
    <section className="mqx-catalog-section">
      <h2 className="mqx-catalog-section__title">{title}</h2>
      {context === 'sheet' ? <div className="mqx-sheet mqx-sheet--amount mqx-sheet--capital mqx-catalog-sheet-preview" role="group" aria-label={title}>
        <div className="mqx-sheet__body">{children}</div>
      </div> : children}
    </section>
  );
}

export function MqCatalogScreen() {
  const [amount, setAmount] = useState(120000);
  const [depositNotice, setDepositNotice] = useState('Условный счёт: 420 000 ₽. Действия не меняют партию.');
  const [templateKey, setTemplateKey] = useState('mq_game_basic_v1');
  const [activeTab, setActiveTab] = useState('active');
  const [activeMode, setActiveMode] = useState('add');
  const [periodCloseOpen, setPeriodCloseOpen] = useState(false);

  return (
    <div className="mqx-catalog app-shell mq-page" style={{ padding: 12 }}>
      <CatalogSection title="Капитал · первое вложение A"><MqxFirstInvestmentDemo /></CatalogSection>
      <CatalogSection title="Опрос первых ходов · гибрид H"><MqxPlaytestSurveyDemo /></CatalogSection>
      <header className="mqx-catalog__header">
        <h1>MQX — библиотека компонентов</h1>
        <p className="mqx-catalog__lead">
          Утверждённые компоненты и их актуальные состояния. Места подключения указаны в примерах.
          Черновики и отклонённые варианты — в{' '}
          <code>design-lab/</code>, не здесь. Аудит:{' '}
          <code>docs/game/specs/UI_CONSISTENCY_AUDIT.md</code>.
        </p>
        <Link to="/" className="mqx-catalog__back">
          ← В игру
        </Link>
      </header>

      <CatalogSection title="Онбординг — Guidance strip (O2 ★)">
        <MqxGuidanceStripDemo />
      </CatalogSection>

      <CatalogSection title="Персонажи и маскоты — ★ B Мягкий объём · A Чистый объём">
        <MqxMascotsCatalogDemo />
      </CatalogSection>

      <CatalogSection title="Выбор жизни (★ BG-2)">
        <p className="mqx-catalog__lead">
          <code>MqxStarterScenarioPicker</code>: карточки персонажей (<code>PersonaPortrait</code> pick), доход за ход,
          стартовые условия; выбранная — фиолетовая рамка. Канон: <code>design-lab/board-game/screens-round/</code>.
        </p>
        <div style={{ maxWidth: 420 }}>
          <MqxStarterScenarioPicker
            value={templateKey}
            label="Персонаж"
            onChange={setTemplateKey}
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

      <CatalogSection title="Меню ★ BG-2 — карта сохранения и спокойные кнопки">
        <p className="mqx-catalog__lead">
          <code>MqxSaveCard</code> (портрет, ход, на счёте, цель + «Продолжить игру») и <code>MqxBoardButton</code>{' '}
          (подпись + пояснение; <code>variant=&quot;link&quot;</code> — текстовая).
        </p>
        <div className="mqx-pg mqx-catalog__pg-demo">
          <MqxSaveCard
            templateKey="mq_game_basic_v1"
            periodIndex={12}
            cash={87400}
            note="Цель: шаг 4 из 5"
            onContinue={() => {}}
          />
          <div className="mqx-pg-actions">
            <MqxBoardButton hint="другая жизнь">Новая игра</MqxBoardButton>
            <MqxBoardButton hint="3 партии">Все сохранения</MqxBoardButton>
          </div>
          <MqxBoardButton variant="link">Выйти из аккаунта</MqxBoardButton>
        </div>
      </CatalogSection>

      <CatalogSection title="Дашборд ★ А — Игровой пульт">
        <MqxPocketBoardDemo />
      </CatalogSection>
      <CatalogSection title="Гостевой старт ★ А"><div data-catalog-demo="guest-first"><MqxGuestWelcome onStart={() => {}} onLogin={() => {}} /><MqxGuestClaim onCreate={() => {}} onContinue={() => {}} /></div></CatalogSection>
      <CatalogSection title="Понятный выбор B · цель A · потребности A"><MqxPlayerDecisionsDemo /></CatalogSection>

      <CatalogSection title="Итог периода ★ (нижний лист)">
        <p className="mqx-catalog__lead" style={{ marginTop: 0 }}>
          <code>MqxPeriodCloseSheet</code> — 6 строк Δ, хвостик с периода 4. Lab: <code>design-lab/period-close/</code>.
        </p>
        <div className="mqx-catalog-current">
          <MqxButton variant="ghost" onClick={() => setPeriodCloseOpen(true)}>Показать итоги периода</MqxButton>
          <MqxPeriodCloseSheet
            open={periodCloseOpen}
            onClose={() => setPeriodCloseOpen(false)}
            summary={CATALOG_PERIOD_CLOSE_SHEET}
          />
        </div>
      </CatalogSection>

      <CatalogSection title="Финал партии ★ BG-2 (победа · поражение)">
        <MqxRunFinaleCatalogDemo />
      </CatalogSection>

      <CatalogSection title="События — E2 / E5 (хвосты) ★">
        <MqxEventsTailsCatalogDemo />
      </CatalogSection>

      <CatalogSection title="Событие — карта, последствия и реплика ★ BG-4">
        <div className="mqx-stack" style={{ gap: 12, maxWidth: 420 }}>
          <MqxPill events badge={2}>
            События
          </MqxPill>
          <EventCard
            event={CATALOG_EVENTS_L3_BASELINE}
            busyId={null}
            onPick={() => {}}
          />
          <p className="mqx-catalog__note">
            Полный оверлей: <code>EventCarouselOverlay</code> в игре (карусель + свайп).
          </p>
        </div>
      </CatalogSection>

      <CatalogSection title="Иконки метрик">
        <p className="mqx-catalog__lead" style={{ marginTop: 0 }}>
          Канон: <code>FinanceMetricIcons</code> · SVG в <code>src/assets/icons/metrics/</code>
        </p>
        <div className="mqx-catalog-glyphs">
          {[
            { key: 'coin', label: 'coin · сумма', className: 'mqx-metric-glyph--coin', Icon: IconMetricCoins },
            { key: 'down', label: 'down · расход', className: 'mqx-metric-glyph--down', Icon: IconMetricTrendDown },
            { key: 'up', label: 'up · доход', className: 'mqx-metric-glyph--up', Icon: IconMetricTrendUp },
            {
              key: 'percent-pos',
              label: '% · получаем',
              className: 'mqx-metric-glyph--percent mqx-metric-glyph--pos',
              Icon: IconMetricPercent,
            },
            {
              key: 'percent-neg',
              label: '% · платим',
              className: 'mqx-metric-glyph--percent mqx-metric-glyph--neg',
              Icon: IconMetricPercent,
            },
            { key: 'term', label: 'term · срок', className: 'mqx-metric-glyph--term', Icon: IconMetricTerm },
            { key: 'shield', label: 'shield · защита', className: 'mqx-metric-glyph--shield', Icon: IconMetricShield },
            { key: 'wallet', label: 'wallet · cash', className: 'mqx-metric-glyph--wallet', Icon: IconMetricWallet },
            { key: 'goal', label: 'goal · chain', className: 'mqx-metric-glyph--goal', Icon: IconMetricGoal },
            { key: 'warn', label: 'warn · ошибка', className: 'mqx-metric-glyph--warn', Icon: IconMetricWarn },
            { key: 'trash', label: 'trash · удалить', className: 'mqx-metric-glyph--trash', Icon: IconMetricTrash },
          ].map(({ key, label, className, Icon }) => (
            <div key={key} className="mqx-catalog-glyphs__item">
              <span className={`mqx-metric-glyph ${className}`}>
                <Icon size={key === 'trash' ? 18 : 16} />
              </span>
              <span className="mqx-catalog-glyphs__label">{label}</span>
            </div>
          ))}
        </div>
      </CatalogSection>

      <CatalogSection title="Страховки — метрики" context="sheet">
        <InsurancePlanMetrics monthlyPremium={2400} payoutAmount={400000} termPeriods={12} />
        <div style={{ marginTop: 10 }}>
          <InsurancePolicyMetrics policy={CATALOG_INSURANCE_POLICY} />
        </div>
      </CatalogSection>

      <CatalogSection title="Страховки — тариф (InsurancePlanCard)" context="sheet">
        <InsurancePlanCard plan={CATALOG_INSURANCE_PLAN} onBuy={() => {}} />
      </CatalogSection>

      <CatalogSection title="Страховки — активный полис (InsurancePolicyRow)" context="sheet">
        <InsurancePolicyRow policy={CATALOG_INSURANCE_POLICY} onCancel={() => {}} />
      </CatalogSection>

      <CatalogSection title="Страховки — блок (InsuranceProductPicker)" context="sheet">
        <InsuranceProductPicker onBuy={() => {}} />
      </CatalogSection>

      <CatalogSection title="Страховки — экран (InsuranceSection)" context="sheet">
        <InsuranceSection
          policies={[CATALOG_INSURANCE_POLICY]}
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

      <CatalogSection title="Примитивы ★ BG-4 — Чернильный край">
        <CurrentPrimitivesDemo />
      </CatalogSection>

      <CatalogSection title="Паттерны действий — список A и подтверждение">
        <CurrentRowActionsDemo />
      </CatalogSection>

      <CatalogSection title="Сегменты капитала — страница и список">
        <CurrentSectionSegDemo />
      </CatalogSection>

      <CatalogSection title="Кнопки и вкладки">
        <div className="mqx-stack" style={{ maxWidth: 360, gap: 8 }}>
          <MqxButton variant="primary" stretched>
            Основное действие
          </MqxButton>
          <MqxButton variant="secondary" stretched>
            Вторичное действие
          </MqxButton>
          <MqxButton variant="ghost" stretched>
            Спокойное действие
          </MqxButton>
          <MqxButton variant="destructive" stretched>
            Удалить
          </MqxButton>
          <p className="mqx-catalog__note" style={{ margin: 0 }}>
            Ссылка: <MqxButton variant="link">Создать аккаунт</MqxButton>
          </p>
        </div>
        <div className="mqx-fin-subtabs-row" style={{ maxWidth: 360, marginTop: 16 }}>
          <MqxSubtab active={activeTab === 'active'} onClick={() => setActiveTab('active')}>Активные</MqxSubtab>
          <MqxSubtab active={activeTab === 'closed'} onClick={() => setActiveTab('closed')}>Закрытые</MqxSubtab>
        </div>
        <div className="mqx-capital-mode-grid" style={{ maxWidth: 360, marginTop: 12 }}>
          <MqxModeButton active={activeMode === 'add'} onClick={() => setActiveMode('add')}>Добавить</MqxModeButton>
          <MqxModeButton active={activeMode === 'mine'} onClick={() => setActiveMode('mine')}>Мои позиции</MqxModeButton>
        </div>
      </CatalogSection>

      <CatalogSection title="Шаблон актива" context="sheet">
        <CapitalPositionCard
          variant="asset"
          kicker="Недвижимость"
          title="Квартира под сдачу"
          metrics={
            <AssetTemplateMetrics assetValue={4200000} monthlyMaintenanceCost={12000} monthlyIncome={35000} />
          }
          action={{ className: 'mqx-fin-icon-btn mqx-fin-icon-btn--plus mqx-capital-add-btn', onClick: () => {} }}
          actionLabel="+"
          actionVerb="Купить"
          actionAriaLabel="Добавить"
        />
      </CatalogSection>

      <CatalogSection title="Позиция актива (компактная строка)" context="sheet">
        <MqxFinListRow
          title="Квартира под сдачу"
          metrics={
            <AssetPositionMetrics assetValue={4200000} monthlyMaintenanceCost={12000} monthlyIncome={35000} />
          }
          trailing={<MqxRowAction variant="remove" verb="Удалить" ariaLabel="Удалить актив" onClick={() => {}} />}
        />
      </CatalogSection>

      <CatalogSection title="Шаблон долга" context="sheet">
        <CapitalPositionCard
          variant="liability"
          kicker="Долг"
          title="Ипотека"
          metrics={
            <LiabilityTemplateMetrics totalDebt={3200000} monthlyPayment={42000} annualRatePercent={12} />
          }
          action={{ className: 'mqx-fin-icon-btn mqx-fin-icon-btn--plus mqx-capital-add-btn', onClick: () => {} }}
          actionLabel="+"
          actionVerb="Взять"
          actionAriaLabel="Взять ипотеку в примере"
        />
      </CatalogSection>

      <CatalogSection title="Позиция долга (компактная строка)" context="sheet">
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
          trailing={<MqxRowAction variant="remove" verb="Удалить" ariaLabel="Удалить долг" onClick={() => {}} />}
        />
      </CatalogSection>

      <CatalogSection title="Позиция депозита" context="sheet">
        <InvestPositionRow
          position={{ id: 1, title: 'Депозит · 14% годовых', principal: 250000, annual_rate_percent: 14 }}
          onClose={() => {}}
          useTextAction
        />
      </CatalogSection>

      <CatalogSection title="Цель раскрыта — ★ BG-3 / BG-4">
        <p className="mqx-catalog__lead">
          Шаги цепочки победы без Монетки, золотой финиш. Lab: <code>design-lab/board-game/hybrid-round/</code>.
        </p>
        <div className="mqx-catalog__board-demo mqx-tab-page--board">
          <div className="mqx-content mqx-tab-page__scroll">
            <MqxGoalDash victory={CATALOG_VICTORY_DEMO} legacyGoal={CATALOG_LEGACY_GOAL_DEMO} defaultExpanded />
          </div>
        </div>
      </CatalogSection>

      <CatalogSection title="Game juice (A · C · D) ★">
        <MqxJuiceCatalogDemo />
      </CatalogSection>

      <CatalogSection title="Состояния UI (empty · error · loading) ★">
        <MqxStatesCatalogDemo />
      </CatalogSection>

      <CatalogSection title="Форма депозита — окно суммы ★ BG-4" context="sheet">
        <p className="mqx-catalog__lead">Та же форма, что в окне капитала: поле суммы, ставка, ползунок и кнопка-фишка.</p>
        <InvestProductForm
          productId="deposit"
          amount={amount}
          maxCash={420000}
          annualRatePercent={12}
          onAmountChange={setAmount}
          onSubmit={() => setDepositNotice(`В примере открыт депозит на ${amount.toLocaleString('ru-RU')} ₽.`)}
          submitLabel="Открыть депозит"
          embedded
        />
        <p role="status">{depositNotice}</p>
      </CatalogSection>
    </div>
  );
}
