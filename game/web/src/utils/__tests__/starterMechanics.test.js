import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  capitalLockHint,
  capitalSectionState,
  getMechanicsFromOverview,
} from '../starterMechanics.js';

describe('starterMechanics — capital sections', () => {
  it('capitalSectionState hidden when not in template', () => {
    const overview = {
      mechanics: { capital_insurance: false },
      mechanics_effective: { capital_insurance: false },
    };
    assert.equal(capitalSectionState(overview, 'capital_insurance'), 'hidden');
  });

  it('capitalSectionState open when effective', () => {
    const overview = {
      mechanics: { capital_insurance: true },
      mechanics_effective: { capital_insurance: true },
    };
    assert.equal(capitalSectionState(overview, 'capital_insurance'), 'open');
  });

  it('capitalSectionState locked when in template but not effective', () => {
    const overview = {
      mechanics: { capital_insurance: true },
      mechanics_effective: { capital_insurance: false },
    };
    assert.equal(capitalSectionState(overview, 'capital_insurance'), 'locked');
  });

  it('capitalLockHint uses current victory goal title', () => {
    const overview = {
      victory: {
        current_goal_key: 'tutorial_invest',
        goals: [{ key: 'tutorial_invest', title: 'Открыть депозит', met: false, enabled: true }],
      },
    };
    const hint = capitalLockHint(overview);
    assert.match(hint, /Открыть депозит/);
  });

  it('getMechanicsFromOverview reads template cap', () => {
    const m = getMechanicsFromOverview({
      mechanics: { capital_insurance: true, capital_invest: true },
    });
    assert.equal(m.capital_insurance, true);
  });
});
