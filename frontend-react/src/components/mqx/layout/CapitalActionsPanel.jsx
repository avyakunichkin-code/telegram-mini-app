import { useMemo } from 'react';
import { InvestProductForm } from '../../InvestProductForm';
import { AssetTemplateMetrics } from '../metrics/AssetTemplateMetrics';
import { LiabilityTemplateMetrics } from '../metrics/LiabilityTemplateMetrics';
import { MqxStateError } from '../primitives/MqxStateError';
import { MqxStateSkeleton } from '../primitives/MqxStateSkeleton';
import { CapitalPositionCard } from './CapitalPositionCard';
import { InsuranceProductPicker } from './InsuranceProductPicker';
import { MqxCapitalActionGrid } from './MqxCapitalActionGrid';
import { MqxCapitalSheet } from './MqxCapitalSheet';

const PROPERTY_KINDS = new Set(['home', 'rental_home']);
const CAR_KINDS = new Set(['car_personal', 'car_taxi']);

const SHEET_COPY = {
  deposit: {
    title: 'Депозит',
    subtitle: 'Депозит растёт в теле вклада. Увеличивается на 1/12 от ставки вклада каждый период.',
  },
  bond: {
    title: 'Облигации',
    subtitle:
      'Облигации платят купон на счёт. 1/12 от ставки добавляется на счёт автоматически в начале каждого периода.',
  },
  realestate: {
    title: 'Недвижимость',
    subtitle: 'Покупка из шаблона списывает стоимость с текущего счёта.',
  },
  car: {
    title: 'Авто',
    subtitle: 'Покупка из шаблона списывает стоимость с текущего счёта.',
  },
  insurance: {
    title: 'Страховки',
    subtitle: 'Премия списывается в конце периода. При страховом случае — полная выплата, полис закрывается.',
  },
  mortgage: {
    title: 'Ипотека',
    subtitle: 'Новый долг зачисляет сумму на счёт; закрытие возвращает тело и гасит просрочку.',
  },
  credit: {
    title: 'Кредит',
    subtitle: 'Новый долг зачисляет сумму на счёт; закрытие возвращает тело и гасит просрочку.',
  },
};

function filterAssetTemplates(templates, kindSet) {
  return templates.filter((t) => kindSet.has(t.kind));
}

function filterLiabilityTemplates(templates, predicate) {
  return templates.filter(predicate);
}

/** Панель «Действия» — сетка плиток + bottom sheets. */
export function CapitalActionsPanel({
  mechanics,
  insuranceSectionState,
  assetTemplates,
  liabilityTemplates,
  extraLoading,
  reloadExtra,
  openSheet,
  onOpenSheet,
  onCloseSheet,
  depositAmount,
  bondAmount,
  maxCash,
  depositRate,
  bondRate,
  onDepositAmountChange,
  onBondAmountChange,
  onOpenDeposit,
  onOpenBond,
  onBuyInsurance,
  buyingPlanKey,
  onAddAssetFromTemplate,
  onAddLiabilityFromTemplate,
}) {
  const visibleIds = useMemo(() => {
    const ids = new Set();
    if (mechanics.capital_invest) {
      ids.add('deposit');
      ids.add('bond');
    }
    if (insuranceSectionState === 'open') ids.add('insurance');
    if (mechanics.capital_property) {
      ids.add('realestate');
      ids.add('car');
    }
    if (mechanics.capital_liabilities) {
      ids.add('mortgage');
      ids.add('credit');
    }
    return ids;
  }, [mechanics, insuranceSectionState]);

  const propertyTemplates = useMemo(
    () => filterAssetTemplates(assetTemplates, PROPERTY_KINDS),
    [assetTemplates],
  );
  const carTemplates = useMemo(() => filterAssetTemplates(assetTemplates, CAR_KINDS), [assetTemplates]);
  const mortgageTemplates = useMemo(
    () => filterLiabilityTemplates(liabilityTemplates, (t) => t.key === 'mortgage'),
    [liabilityTemplates],
  );
  const creditTemplates = useMemo(
    () => filterLiabilityTemplates(liabilityTemplates, (t) => t.key !== 'mortgage'),
    [liabilityTemplates],
  );

  const sheetCopy = openSheet ? SHEET_COPY[openSheet] : null;

  const renderTemplateList = (templates, variant, onAdd) => {
    if (extraLoading) return <MqxStateSkeleton variant="rows" rows={2} />;
    if (templates.length === 0) {
      return (
        <MqxStateError
          title="Шаблоны не загружены"
          message="Проверьте сеть и попробуйте снова"
          onRetry={() => void reloadExtra?.()}
        />
      );
    }
    return (
      <div className="mqx-capital-template-list">
        {templates.map((t) => (
          <CapitalPositionCard
            key={t.key}
            variant={variant}
            title={t.title}
            metrics={
              variant === 'liability' ? (
                <LiabilityTemplateMetrics
                  totalDebt={t.total_debt}
                  monthlyPayment={t.monthly_payment}
                  annualRatePercent={t.annual_rate_percent}
                />
              ) : (
                <AssetTemplateMetrics
                  assetValue={t.asset_value}
                  monthlyMaintenanceCost={t.monthly_maintenance_cost}
                  monthlyIncome={t.monthly_income}
                />
              )
            }
            action={{ onClick: () => void onAdd(t) }}
            actionLabel="+"
            actionAriaLabel={`Добавить: ${t.title}`}
          />
        ))}
      </div>
    );
  };

  const renderSheetBody = () => {
    switch (openSheet) {
      case 'deposit':
        return (
          <InvestProductForm
            embedded
            productId="deposit"
            productTitle="Депозит"
            amount={depositAmount}
            maxCash={maxCash}
            annualRatePercent={depositRate}
            onAmountChange={onDepositAmountChange}
            submitLabel="Открыть депозит"
            onSubmit={() => void onOpenDeposit()}
          />
        );
      case 'bond':
        return (
          <InvestProductForm
            embedded
            productId="bond"
            productTitle="Облигации"
            amount={bondAmount}
            maxCash={maxCash}
            annualRatePercent={bondRate}
            onAmountChange={onBondAmountChange}
            submitLabel="Купить облигации"
            onSubmit={() => void onOpenBond()}
          />
        );
      case 'realestate':
        return renderTemplateList(propertyTemplates, 'asset', onAddAssetFromTemplate);
      case 'car':
        return renderTemplateList(carTemplates, 'asset', onAddAssetFromTemplate);
      case 'insurance':
        return <InsuranceProductPicker onBuy={onBuyInsurance} buyingPlanKey={buyingPlanKey} />;
      case 'mortgage':
        return renderTemplateList(mortgageTemplates, 'liability', onAddLiabilityFromTemplate);
      case 'credit':
        return renderTemplateList(creditTemplates, 'liability', onAddLiabilityFromTemplate);
      default:
        return null;
    }
  };

  return (
    <>
      <MqxCapitalActionGrid visibleIds={visibleIds} onOpenSheet={onOpenSheet} />
      <MqxCapitalSheet
        open={Boolean(openSheet && sheetCopy)}
        title={sheetCopy?.title}
        subtitle={sheetCopy?.subtitle}
        onClose={onCloseSheet}
      >
        {renderSheetBody()}
      </MqxCapitalSheet>
    </>
  );
}
