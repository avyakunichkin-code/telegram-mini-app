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
  IconMetricTrendDown,
  IconMetricTrendUp,
  InvestPositionMetrics,
  LiabilityPositionMetrics,
  LiabilityTemplateMetrics,
  MetricInlineItem,
  MetricsRow,
} from '../index';

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
        </div>
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

      <CatalogSection title="Кнопки и вкладки">
        <div className="mqx-fin-subtabs-row" style={{ maxWidth: 360 }}>
          <button type="button" className="mqx-fin-subtab mqx-fin-subtab--active">
            Активные
          </button>
          <button type="button" className="mqx-fin-subtab">
            В рамке
          </button>
        </div>
        <div className="mqx-capital-mode-grid" style={{ maxWidth: 360, marginTop: 12 }}>
          <button type="button" className="mqx-capital-mode-btn mqx-capital-mode-btn--active">
            Режим вкл
          </button>
          <button type="button" className="mqx-capital-mode-btn">
            Режим выкл
          </button>
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
