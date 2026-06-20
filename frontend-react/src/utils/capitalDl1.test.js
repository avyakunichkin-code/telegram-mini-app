import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildSecuredBundles,
  canPrepayLiability,
  computeSalePreview,
  filterCarAssetTemplates,
  filterPropertyAssetTemplates,
  isConsumerLiabilityTemplate,
  isPropertyAssetKind,
  isSecuredLiabilityTemplate,
} from './capitalDl1.js';

describe('capitalDl1', () => {
  it('detects secured vs consumer templates', () => {
    assert.equal(isSecuredLiabilityTemplate({ liability_kind: 'mortgage' }), true);
    assert.equal(isConsumerLiabilityTemplate({ liability_kind: 'consumer', disbursement_mode: 'to_cash' }), true);
    assert.equal(isConsumerLiabilityTemplate({ liability_kind: 'mortgage' }), false);
  });

  it('builds mortgage bundle by asset kind', () => {
    const bundles = buildSecuredBundles(
      [
        {
          key: 'mortgage',
          title: 'Ипотека',
          liability_kind: 'mortgage',
          requires_asset_kind: 'home',
          down_payment_amount: 2_000_000,
          monthly_payment: 80_000,
          annual_rate_percent: 12,
          term_periods: 240,
        },
      ],
      [{ key: 'apt', title: 'Квартира', kind: 'home', asset_value: 10_000_000 }],
    );
    assert.equal(bundles.length, 1);
    assert.equal(bundles[0].principal, 8_000_000);
  });

  it('computeSalePreview matches payoff formula', () => {
    const r = computeSalePreview({ asset_value: 1_100_000 }, { total_debt: 791_513.93, overdue_amount: 5_000 });
    assert.equal(r.payoff, 796_513.93);
    assert.equal(r.cashNet, 303_486.07);
    assert.equal(r.topUp, 0);
  });

  it('canPrepayLiability excludes interest_only', () => {
    assert.equal(canPrepayLiability({ payment_mode: 'annuity', term_periods: 36 }), true);
    assert.equal(canPrepayLiability({ payment_mode: 'interest_only', term_periods: null }), false);
    assert.equal(canPrepayLiability({ payment_mode: 'interest_only', term_periods: 12 }), false);
  });

  it('filters property vs car asset templates', () => {
    const templates = [
      { key: 'apt_1br', kind: 'home' },
      { key: 'house_private_income', kind: 'rental_house' },
      { key: 'lease_studio', kind: 'leased_dwelling' },
      { key: 'car_personal', kind: 'car_personal' },
    ];
    assert.equal(filterPropertyAssetTemplates(templates).length, 3);
    assert.equal(filterCarAssetTemplates(templates).length, 1);
    assert.equal(isPropertyAssetKind('rental_house'), true);
    assert.equal(isPropertyAssetKind('car_taxi'), false);
  });
});
