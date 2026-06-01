import { useEffect, useMemo, useState } from 'react';
import { API } from '../api';
import {
  BOND_ANNUAL_RATE_PERCENT,
  clampInvestAmount,
  DEPOSIT_ANNUAL_RATE_PERCENT,
} from '../constants/investProducts';
import { capitalPageSubtitle, capitalLockHint, capitalSectionState, getEffectiveMechanicsFromOverview } from '../utils/starterMechanics';
import { useMqxConfirm } from './mqx';
import { CapitalActionsPanel } from './mqx/layout/CapitalActionsPanel';
import { CapitalDetailsPanel } from './mqx/layout/CapitalDetailsPanel';
import { CapitalPeriodFlowsBlock } from './mqx/layout/CapitalPeriodFlowsBlock';
import { MqxCapitalPageModeSeg } from './mqx/layout/MqxCapitalPageModeSeg';
import { MqxTabHero } from './MqxTabHero';
import { showNotification } from './notifications';

/** Вкладка «Капитал»: потоки → Детали|Действия → позиции или сетка действий. */
export function FinancePremium({
  overview,
  refreshOverview,
  openFlowsSection = null,
  onFlowsSectionOpened,
}) {
  const { dialog } = useMqxConfirm();
  const [pageMode, setPageMode] = useState('details');
  const [openSheet, setOpenSheet] = useState(null);
  const [investPositions, setInvestPositions] = useState([]);
  const [policies, setPolicies] = useState([]);
  const [depositAmount, setDepositAmount] = useState(0);
  const [bondAmount, setBondAmount] = useState(0);
  const [buyingPlanKey, setBuyingPlanKey] = useState(null);
  const [cancellingPolicyId, setCancellingPolicyId] = useState(null);
  const [assetTemplates, setAssetTemplates] = useState([]);
  const [liabilityTemplates, setLiabilityTemplates] = useState([]);
  const [extraLoading, setExtraLoading] = useState(true);
  const [securedAcquireBusyKey, setSecuredAcquireBusyKey] = useState(null);
  const [prepayBusy, setPrepayBusy] = useState(false);

  const mechanics = useMemo(() => getEffectiveMechanicsFromOverview(overview), [overview]);
  const insuranceSectionState = useMemo(
    () => capitalSectionState(overview, 'capital_insurance'),
    [overview],
  );
  const insuranceLockHint = useMemo(
    () => (insuranceSectionState === 'locked' ? capitalLockHint(overview) : null),
    [insuranceSectionState, overview],
  );

  useEffect(() => {
    if (!openFlowsSection) return undefined;
    const sectionId =
      openFlowsSection === 'expense' ? 'capital-flows-expense' : 'capital-flows-income';
    const frame = requestAnimationFrame(() => {
      const reduceMotion =
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      document.getElementById(sectionId)?.scrollIntoView({
        behavior: reduceMotion ? 'auto' : 'smooth',
        block: 'nearest',
      });
      onFlowsSectionOpened?.();
    });
    return () => cancelAnimationFrame(frame);
  }, [openFlowsSection, onFlowsSectionOpened]);

  const reloadExtra = async ({ quiet = false } = {}) => {
    setExtraLoading(true);
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
    } catch (e) {
      if (!quiet) {
        showNotification(e?.detail || e?.message || 'Не удалось обновить разделы капитала', 'error');
      }
    } finally {
      setExtraLoading(false);
    }
  };

  useEffect(() => {
    reloadExtra({ quiet: true });
  }, []);

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
      const res = await API.deleteAsset(id);
      await refreshOverview();
      if (res?.payoff > 0) {
        const parts = [`Продано. Погашено кредита: ${Math.round(res.payoff).toLocaleString('ru-RU')} ₽`];
        if (res.cash_net > 0) parts.push(`на счёт: ${Math.round(res.cash_net).toLocaleString('ru-RU')} ₽`);
        if (res.top_up > 0) parts.push(`доплата: ${Math.round(res.top_up).toLocaleString('ru-RU')} ₽`);
        showNotification(parts.join(' · '), 'success');
      } else {
        showNotification('Актив продан', 'success');
      }
    } catch (err) {
      showNotification(err?.detail || err?.message || 'Ошибка соединения', 'error');
    }
  };

  const buyInsurancePlan = async (payload, plan) => {
    setBuyingPlanKey(plan.plan_key);
    try {
      await API.buyPolicy(payload);
      showNotification('Полис оформлен', 'success');
      await refreshOverview();
      await reloadExtra();
      setOpenSheet(null);
    } catch (e) {
      showNotification(e, 'error');
    } finally {
      setBuyingPlanKey(null);
    }
  };

  const cancelInsurancePolicy = async (policyId) => {
    setCancellingPolicyId(policyId);
    try {
      await API.cancelPolicy(policyId);
      showNotification('Полис отменён', 'success');
      await reloadExtra();
    } catch (e) {
      showNotification(e, 'error');
    } finally {
      setCancellingPolicyId(null);
    }
  };

  const addSecuredAcquisition = async (bundle) => {
    const busyKey = `${bundle.liabilityKey}:${bundle.assetKey}`;
    setSecuredAcquireBusyKey(busyKey);
    try {
      await API.createSecuredAcquisition({
        liability_key: bundle.liabilityKey,
        asset_key: bundle.assetKey,
      });
      showNotification(`${bundle.assetTitle}: оформлено с первым взносом`, 'success');
      await refreshOverview();
      await reloadExtra();
      setOpenSheet(null);
    } catch (e) {
      showNotification(e?.detail || e?.message || 'Не удалось оформить покупку в кредит', 'error');
    } finally {
      setSecuredAcquireBusyKey(null);
    }
  };

  const handlePrepayLiability = async (liabilityId, amount) => {
    setPrepayBusy(true);
    try {
      await API.prepayLiability(liabilityId, amount);
      showNotification('Досрочное погашение выполнено', 'success');
      await refreshOverview();
    } catch (e) {
      showNotification(e?.detail || e?.message || 'Не удалось погасить досрочно', 'error');
    } finally {
      setPrepayBusy(false);
    }
  };

  const addLiabilityFromTemplate = async (t) => {
    try {
      await API.createLiabilityFromTemplate(t.key);
      showNotification('Кредит оформлен: сумма зачислена на счёт', 'success');
      await refreshOverview();
      await reloadExtra();
      setOpenSheet(null);
    } catch (e) {
      showNotification(e?.detail || e?.message || 'Не удалось добавить долг', 'error');
    }
  };

  const addAssetFromTemplate = async (t) => {
    try {
      await API.createAssetFromTemplate(t.key);
      showNotification('Актив добавлен', 'success');
      await refreshOverview();
      await reloadExtra();
      setOpenSheet(null);
    } catch (e) {
      showNotification(e?.detail || e?.message || 'Не удалось добавить актив', 'error');
    }
  };

  if (!overview) return null;

  const ownedAssets = overview.assets || [];
  const ownedLiabilities = overview.liabilities || [];

  const openDeposit = async () => {
    try {
      await API.openDeposit({ amount: depositAmount, annual_rate_percent: DEPOSIT_ANNUAL_RATE_PERCENT });
      showNotification('Депозит открыт', 'success');
      setDepositAmount(0);
      await refreshOverview();
      await reloadExtra();
      setOpenSheet(null);
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
      setOpenSheet(null);
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

  const handleGotoAction = (sheetId) => {
    setPageMode('actions');
    setOpenSheet(sheetId);
  };

  return (
    <div className="mqx-tab-page">
      <MqxTabHero
        heroClassName="mqx-hero--capital"
        inlineTitle
        title="Капитал"
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

            <MqxCapitalPageModeSeg mode={pageMode} onModeChange={setPageMode} />

            {pageMode === 'details' ? (
              <CapitalDetailsPanel
                mechanics={mechanics}
                insuranceSectionState={insuranceSectionState}
                insuranceLockHint={insuranceLockHint}
                investPositions={investPositions}
                policies={policies}
                ownedAssets={ownedAssets}
                ownedLiabilities={ownedLiabilities}
                extraLoading={extraLoading}
                onCloseInvest={closeInvest}
                onCancelPolicy={cancelInsurancePolicy}
                cancellingPolicyId={cancellingPolicyId}
                onDeleteAsset={handleDeleteAsset}
                onDeleteLiability={handleDeleteLiability}
                onPrepayLiability={handlePrepayLiability}
                prepayBusy={prepayBusy}
                maxCash={maxCash}
                onGotoAction={handleGotoAction}
              />
            ) : (
              <CapitalActionsPanel
                mechanics={mechanics}
                insuranceSectionState={insuranceSectionState}
                assetTemplates={assetTemplates}
                liabilityTemplates={liabilityTemplates}
                extraLoading={extraLoading}
                reloadExtra={reloadExtra}
                openSheet={openSheet}
                onOpenSheet={setOpenSheet}
                onCloseSheet={() => setOpenSheet(null)}
                depositAmount={depositAmount}
                bondAmount={bondAmount}
                maxCash={maxCash}
                depositRate={DEPOSIT_ANNUAL_RATE_PERCENT}
                bondRate={BOND_ANNUAL_RATE_PERCENT}
                onDepositAmountChange={setDepositAmount}
                onBondAmountChange={setBondAmount}
                onOpenDeposit={openDeposit}
                onOpenBond={openBond}
                onBuyInsurance={buyInsurancePlan}
                buyingPlanKey={buyingPlanKey}
                onAddAssetFromTemplate={addAssetFromTemplate}
                onAddLiabilityFromTemplate={addLiabilityFromTemplate}
                onSecuredAcquisition={addSecuredAcquisition}
                securedAcquireBusyKey={securedAcquireBusyKey}
                ownedAssets={ownedAssets}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
