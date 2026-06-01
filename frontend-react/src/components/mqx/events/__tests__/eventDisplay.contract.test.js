import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  choiceHasInsuranceClaim,
  eventHasInsuranceClaimChoice,
} from '../eventDisplay.js';
import {
  eventDomainLabel,
  eventDomainModifier,
  eventDomainTheme,
} from '../eventDomainDisplay.js';

describe('eventDisplay — E2 insurance halo trigger', () => {
  it('detects insurance_claim on any choice', () => {
    assert.equal(choiceHasInsuranceClaim({ insurance_claim: true }), true);
    assert.equal(choiceHasInsuranceClaim({ insurance_claim: false }), false);
    assert.equal(choiceHasInsuranceClaim({}), false);
    assert.equal(choiceHasInsuranceClaim(null), false);
  });

  it('eventHasInsuranceClaimChoice is false without choices', () => {
    assert.equal(eventHasInsuranceClaimChoice({ choices: [] }), false);
    assert.equal(eventHasInsuranceClaimChoice({}), false);
  });

  it('eventHasInsuranceClaimChoice true when one choice has claim', () => {
    const event = {
      choices: [
        { id: 1, title: 'Cash' },
        { id: 2, title: 'Policy', insurance_claim: true },
      ],
    };
    assert.equal(eventHasInsuranceClaimChoice(event), true);
  });
});

describe('eventDomainDisplay — L3 domain pill', () => {
  it('maps known domains to Russian labels', () => {
    assert.equal(eventDomainLabel('auto'), 'Авто');
    assert.equal(eventDomainLabel('consumption'), 'Повседневное');
    assert.equal(eventDomainLabel('social_family'), 'Семья');
  });

  it('falls back for unknown domain', () => {
    assert.equal(eventDomainLabel(''), 'Событие');
    assert.equal(eventDomainLabel('unknown_xyz'), 'Событие');
  });

  it('modifier uses kebab-case CSS class', () => {
    assert.equal(eventDomainModifier('credit_debt'), 'mqx-events-card--domain-credit-debt');
    assert.equal(eventDomainModifier('auto'), 'mqx-events-card--domain-auto');
  });

  it('unknown modifier defaults to consumption skin', () => {
    assert.equal(eventDomainModifier('nope'), 'mqx-events-card--domain-consumption');
  });

  it('eventDomainTheme bundles key, label, modifierClass', () => {
    const theme = eventDomainTheme({ event_domain: 'health' });
    assert.deepEqual(theme, {
      key: 'health',
      label: 'Здоровье',
      modifierClass: 'mqx-events-card--domain-health',
    });
  });

  it('defaults missing event_domain to consumption', () => {
    const theme = eventDomainTheme({});
    assert.equal(theme.key, 'consumption');
    assert.equal(theme.modifierClass, 'mqx-events-card--domain-consumption');
  });
});
