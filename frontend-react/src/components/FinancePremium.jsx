import { useEffect, useMemo, useState } from 'react';
import { API } from '../api';
import {
  BOND_ANNUAL_RATE_PERCENT,
  clampInvestAmount,
  DEPOSIT_ANNUAL_RATE_PERCENT,
} from '../constants/investProducts';
import { capitalPageSubtitle, getMechanicsFromOverview } from '../utils/starterMechanics';
import { CapitalLiabilitiesPanel, CapitalPropertyPanel } from './CapitalPortfolioPanels';
import { InvestProductForm } from './InvestProductForm';
import {
  InsuranceSection,
  InvestPositionRow,
  MqxCapitalEmpty,
  MqxSectionSeg,
  MqxSubtab,
  useMqxConfirm,
} from './mqx';
import { CapitalPeriodFlowsBlock } from './mqx/layout/CapitalPeriodFlowsBlock';
import { MqxCapitalSectionAccordion } from './mqx/layout/MqxCapitalSectionAccordion';
import { MqxTabHero } from './MqxTabHero';
import { showNotification } from './notifications';

const DEPOSIT_HELP =
  'Депозит растёт в теле вклада. Увеличивается на 1/12 от ставки вклада каждый период.';

const BOND_HELP =
  'Облигации платят купон на счёт. 1/12 от ставки добавляется на счёт автоматически в начале каждого периода.';

/** Вкладка «Финансы»: управление капиталом (аккордеоны по mechanics шаблона). */
export function FinancePremium({
  overview,
  refreshOverview,
  openFlowsSection = null,
  onFlowsSectionOpened,
}) {
  const { confirm, dialog } = useMqxConfirm();
  const [investPositions, setInvestPositions] = useState([]);
  const [policies, setPolicies] = useState([]);
  const [depositAmount, setDepositAmount] = useState(0);
  const [bondAmount, setBondAmount] = useState(0);
  const [buyingPlanKey, setBuyingPlanKey] = useState(null);
  const [cancellingPolicyId, setCancellingPolicyId] = useState(null);
  const [assetTemplates, setAssetTemplates] = useState([]);
  const [liabilityTemplates, setLiabilityTemplates] = useState([]);
  const [investProductTab, setInvestProductTab] = useState('deposit');
  const [investUiMode, setInvestUiMode] = useState('form');
  const [portfolioAssetsMode, setPortfolioAssetsMode] = useState('add');
  const [portfolioDebtsMode, setPortfolioDebtsMode] = useState('add');

  const mechanics = useMemo(() => getMechanicsFromOverview(overview), [overview]);
  const capitalSectionsCount =
    2 +
    (mechanics.capital_invest ? 1 : 0) +
    (mechanics.capital_insurance ? 1 : 0) +
    (mechanics.capital_property ? 1 : 0) +
    (mechanics.capital_liabilities ? 1 : 0);

  useEffect(() => {
    if (!openFlowsSection) return undefined;
    const sectionId =
      openFlowsSection === 'expense' ? 'capital-flows-expense' : 'capital-flows-income';
    const frame = requestAnimationFrame(() => {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      onFlowsSectionOpened?.();
    });
    return () => cancelAnimationFrame(frame);
  }, [openFlowsSection, onFlowsSectionOpened]);

  const reloadExtra = async () => {
    try {
      const [pos, pol, tpl, ltpl] = await Promise.all([
        API.listInvestPositions(),
        API.listPolicies(),
        API.getAssetTemplates(),
        API.getLiabilityTemplates(),
      ]);
      if (Array.isArray(pos)) setInvestPositions(pos);
      if (Array.isArray(pol)) setPolicies(pol);
      if (Array.isArray(tpl)) setAssetTemplates(tpl);
      if (Array.isArray(ltpl)) setLiabilityTemplates(ltpl);
    } catch {
      // не блокируем экран
    }
  };

  useEffect(() => {
    reloadExtra();
  }, []);

  useEffect(() => {
    setInvestUiMode('form');
  }, [investProductTab]);

  const maxCash = Math.max(0, Math.floor(Number(overview?.cash_balance) || 0));

  useEffect(() => {
    setDepositAmount((v) => clampInvestAmount(v, maxCash));
    setBondAmount((v) => clampInvestAmount(v, maxCash));
  }, [maxCash]);

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

  const buyInsurancePlan = async (plan) => {
    setBuyingPlanKey(plan.plan_key);
    try {
      await API.buyPolicy({ plan_key: plan.plan_key });
      showNotification('Полис оформлен', 'success');
      await refreshOverview();
      await reloadExtra();
    } catch (e) {
      showNotification(e?.detail || e?.message || 'Не удалось оформить полис', 'error');
    } finally {
      setBuyingPlanKey(null);
    }
  };

  const cancelInsurancePolicy = async (policyId) => {
    const policy = policies.find((p) => p.id === policyId);
    const ok = await confirm({
      title: 'Отменить полис?',
      message: policy ? `«${policy.title}» перестанет действовать.` : 'Полис перестанет действовать.',
    });
    if (!ok) return;

    setCancellingPolicyId(policyId);
    try {
      await API.cancelPolicy(policyId);
      showNotification('Полис отменён', 'success');
      await reloadExtra();
    } catch (e) {
      showNotification(e?.detail || e?.message || 'Не удалось отменить полис', 'error');
    } finally {
      setCancellingPolicyId(null);
    }
  };

  const addLiabilityFromTemplate = async (t) => {
    try {
      await API.createLiabilityFromTemplate(t.key);
      showNotification('Обязательство добавлено: сумма зачислена на счёт', 'success');
      await refreshOverview();
    } catch (e) {
      showNotification(e?.detail || e?.message || 'Не удалось добавить долг', 'error');
    }
  };

  if (!overview) return null;

  const depositPositions = investPositions.filter((p) => p.kind === 'deposit');
  const bondPositions = investPositions.filter((p) => p.kind === 'bond');
  const selectedInvestSubtitle = investProductTab === 'deposit' ? DEPOSIT_HELP : BOND_HELP;
  const selectedInvestPositions = investProductTab === 'deposit' ? depositPositions : bondPositions;
  const ownedAssets = overview.assets || [];
  const ownedLiabilities = overview.liabilities || [];
  const investSegMode = investUiMode === 'form' ? 'add' : 'mine';
  const propertySegMode = portfolioAssetsMode === 'positions' ? 'mine' : portfolioAssetsMode;
  const liabilitiesSegMode = portfolioDebtsMode === 'positions' ? 'mine' : portfolioDebtsMode;

  const openDeposit = async () => {
    try {
      await API.openDeposit({ amount: depositAmount, annual_rate_percent: DEPOSIT_ANNUAL_RATE_PERCENT });
      showNotification('Депозит открыт', 'success');
      setDepositAmount(0);
      await refreshOverview();
      await reloadExtra();
    } catch (e) {
      showNotification(e?.detail || e?.message || 'Не удалось открыть депозит', 'error');
    }
  };

  const openBond = async () => {
    try {
      await API.buyBond({
        amount: bondAmount,
        annual_rate_percent: BOND_ANNUAL_RATE_PERCENT,
        title: 'Облигации (easy)',
      });
      showNotification('Облигации добавлены', 'success');
      setBondAmount(0);
      await refreshOverview();
      await reloadExtra();
    } catch (e) {
      showNotification(e?.detail || e?.message || 'Не удалось добавить облигации', 'error');
    }
  };

  const closeInvest = async (id) => {
    try {
      await API.closeInvestPosition(id);
      showNotification('Позиция закрыта', 'success');
      await refreshOverview();
      await reloadExtra();
    } catch (e) {
      showNotification(e?.detail || e?.message || 'Не удалось закрыть позицию', 'error');
    }
  };

  const requestCloseInvest = async (position) => {
    const ok = await confirm({
      title: 'Закрыть позицию?',
      message: `«${position.title}» будет закрыта.`,
    });
    if (ok) await closeInvest(position.id);
  };

  const investCapitalBlock = (
    <>
      <div className="mqx-fin-subtabs mqx-fin-subtabs-row" role="tablist" aria-label="Инструмент">
        <MqxSubtab
          role="tab"
          aria-selected={investProductTab === 'deposit'}
          active={investProductTab === 'deposit'}
          onClick={() => setInvestProductTab('deposit')}
        >
          Депозиты
        </MqxSubtab>
        <MqxSubtab
          role="tab"
          aria-selected={investProductTab === 'bond'}
          active={investProductTab === 'bond'}
          onClick={() => setInvestProductTab('bond')}
        >
          Облигации
        </MqxSubtab>
      </div>
      <div className="mqx-fin-longhelp">{selectedInvestSubtitle}</div>
      <MqxSectionSeg
        mode={investSegMode}
        onModeChange={(m) => setInvestUiMode(m === 'add' ? 'form' : 'positions')}
        addLabel="Оформить"
        mineLabel="Позиции"
        mineCount={selectedInvestPositions.length}
      />
      {investUiMode === 'form' ? (
        <InvestProductForm
          embedded
          productId={investProductTab}
          productTitle={investProductTab === 'deposit' ? 'Депозит' : 'Облигации'}
          amount={investProductTab === 'deposit' ? depositAmount : bondAmount}
          maxCash={maxCash}
          annualRatePercent={
            investProductTab === 'deposit' ? DEPOSIT_ANNUAL_RATE_PERCENT : BOND_ANNUAL_RATE_PERCENT
          }
          onAmountChange={investProductTab === 'deposit' ? setDepositAmount : setBondAmount}
          submitLabel={investProductTab === 'deposit' ? 'Открыть депозит' : 'Купить облигации'}
          onSubmit={() => void (investProductTab === 'deposit' ? openDeposit() : openBond())}
        />
      ) : (
        <div className="mqx-capital-position-list">
          {selectedInvestPositions.length === 0 ? (
            <MqxCapitalEmpty
              message={`Нет позиций: ${investProductTab === 'deposit' ? 'депозитов' : 'облигаций'}`}
              actionLabel="Оформить"
              onAction={() => setInvestUiMode('form')}
            />
          ) : (
            selectedInvestPositions.map((p) => (
              <InvestPositionRow
                key={p.id}
                position={p}
                onCloseRequest={() => void requestCloseInvest(p)}
              />
            ))
          )}
        </div>
      )}
    </>
  );

  const investMeta = `${investPositions.length} поз.`;
  const insuranceMeta = `${policies.length} полис.`;
  const propertyMeta = `${ownedAssets.length} поз.`;
  const liabilitiesMeta = `${ownedLiabilities.length} долг.`;

  return (
    <div className="mqx-tab-page">
      <MqxTabHero
        heroClassName="mqx-hero--capital"
        sectionLabel="Финансы"
        rightPill={`${capitalSectionsCount} разделов`}
        title="Управление капиталом"
        titleClassName="mqx-hero__title--capital"
        subtitleClassName="mqx-hero__sub--capital"
        subtitle={capitalPageSubtitle(mechanics)}
      />

      <main className="mqx-content mqx-tab-page__scroll mqx-capital-page">
        <div className="mqx-fin mqx-fin--capital">
          {dialog}
          <div className="mqx-capital-accordion-stack">
            <CapitalPeriodFlowsBlock
              overview={overview}
              investPositions={investPositions}
              policies={policies}
              openFlowsSection={openFlowsSection}
            />
            {mechanics.capital_invest ? (
              <MqxCapitalSectionAccordion title="Инвестиции" meta={investMeta}>
                {investCapitalBlock}
              </MqxCapitalSectionAccordion>
            ) : null}
            {mechanics.capital_insurance ? (
              <MqxCapitalSectionAccordion title="Страховки" meta={insuranceMeta}>
                <InsuranceSection
                  policies={policies}
                  buyingPlanKey={buyingPlanKey}
                  cancellingPolicyId={cancellingPolicyId}
                  onBuy={buyInsurancePlan}
                  onCancel={cancelInsurancePolicy}
                  intro="Премия списывается в конце периода. При страховом случае — полная сумма выплаты, полис закрывается."
                  useSectionSeg
                />
              </MqxCapitalSectionAccordion>
            ) : null}
            {mechanics.capital_property ? (
              <MqxCapitalSectionAccordion title="Имущество" meta={propertyMeta}>
                <CapitalPropertyPanel
                  assetTemplates={assetTemplates}
                  ownedAssets={ownedAssets}
                  sectionMode={propertySegMode}
                  setSectionMode={(m) => setPortfolioAssetsMode(m === 'mine' ? 'positions' : m)}
                  refreshOverview={refreshOverview}
                  reloadExtra={reloadExtra}
                  handleDeleteAsset={handleDeleteAsset}
                />
              </MqxCapitalSectionAccordion>
            ) : null}
            {mechanics.capital_liabilities ? (
              <MqxCapitalSectionAccordion title="Обязательства" meta={liabilitiesMeta}>
                <CapitalLiabilitiesPanel
                  liabilityTemplates={liabilityTemplates}
                  ownedLiabilities={ownedLiabilities}
                  sectionMode={liabilitiesSegMode}
                  setSectionMode={(m) => setPortfolioDebtsMode(m === 'mine' ? 'positions' : m)}
                  addLiabilityFromTemplate={addLiabilityFromTemplate}
                  handleDeleteLiability={handleDeleteLiability}
                />
              </MqxCapitalSectionAccordion>
            ) : null}
          </div>
        </div>
      </main>
    </div>
  );
}
