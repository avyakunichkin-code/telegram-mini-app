/** DL1: secured bundles, sale preview, template filters (SPEC debt-liability-capital-graph). */

const SECURED_KINDS = new Set(['mortgage', 'auto_loan']);

export function isSecuredLiabilityTemplate(t) {
  if (!t) return false;
  if (SECURED_KINDS.has(t.liability_kind)) return true;
  return t.disbursement_mode === 'to_asset_purchase';
}

export function isConsumerLiabilityTemplate(t) {
  if (!t || isSecuredLiabilityTemplate(t)) return false;
  const kind = t.liability_kind || 'consumer';
  return kind === 'consumer' || kind === 'unsecured' || t.disbursement_mode === 'to_cash';
}

function assetMatchesLiabilityTemplate(liabTpl, assetTpl) {
  const linked = liabTpl.linked_asset_template_key;
  if (linked) return assetTpl.key === linked;
  const req = (liabTpl.requires_asset_kind || '').toLowerCase();
  const kind = (assetTpl.kind || '').toLowerCase();
  if (!req) return false;
  if (req === 'car') return kind.startsWith('car');
  if (req === 'home') return kind === 'home' || kind === 'rental_home' || kind.startsWith('apt');
  return kind === req || kind.startsWith(req);
}

/** Пары «кредит + актив» для POST /acquisitions/secured. */
export function buildSecuredBundles(liabilityTemplates, assetTemplates) {
  const bundles = [];
  for (const liab of liabilityTemplates || []) {
    if (!isSecuredLiabilityTemplate(liab)) continue;
    for (const asset of assetTemplates || []) {
      if (!assetMatchesLiabilityTemplate(liab, asset)) continue;
      bundles.push({
        liabilityKey: liab.key,
        assetKey: asset.key,
        liabilityTitle: liab.title,
        assetTitle: asset.title,
        assetValue: asset.asset_value,
        downPayment: Number(liab.down_payment_amount) || 0,
        principal: Math.max(0, Number(asset.asset_value) - (Number(liab.down_payment_amount) || 0)),
        monthlyPayment: liab.monthly_payment,
        annualRatePercent: liab.annual_rate_percent,
        termPeriods: liab.term_periods,
      });
    }
  }
  return bundles;
}

export function filterBundlesForSheet(bundles, sheetId) {
  if (sheetId === 'mortgage') {
    return bundles.filter((b) => b.liabilityKey === 'mortgage');
  }
  if (sheetId === 'car') {
    return bundles.filter((b) => b.liabilityKey === 'car_loan');
  }
  return [];
}

export function computeSalePreview(asset, liability) {
  const salePrice = Number(asset?.asset_value) || 0;
  const overdue = Number(liability?.overdue_amount) || 0;
  const debt = Number(liability?.total_debt) || 0;
  const payoff = Math.round((overdue + debt) * 100) / 100;
  const cashNet = Math.max(0, Math.round((salePrice - payoff) * 100) / 100);
  const topUp = Math.max(0, Math.round((payoff - salePrice) * 100) / 100);
  return { payoff, cashNet, topUp };
}

export function findSecuredLiabilityForAsset(liabilities, assetId) {
  return (liabilities || []).find(
    (l) => l.is_active !== 0 && Number(l.secured_asset_id) === Number(assetId),
  );
}

export function canPrepayLiability(liability) {
  if (!liability) return false;
  if (liability.payment_mode === 'annuity') return true;
  return Number(liability.term_periods) > 0;
}

export function insuranceKindNeedsAsset(kind) {
  if (kind === 'auto_liability' || kind === 'auto_property') return 'car';
  if (kind === 'mortgage_property') return 'home';
  if (kind === 'property_property') return 'home';
  return null;
}

export function assetsForInsuranceKind(ownedAssets, need) {
  if (!need) return ownedAssets || [];
  return (ownedAssets || []).filter((a) => {
    const k = (a.kind || '').toLowerCase();
    if (need === 'car') return k.startsWith('car');
    if (need === 'home') {
      return k === 'home' || k === 'rental_home' || k.startsWith('apt');
    }
    return true;
  });
}
