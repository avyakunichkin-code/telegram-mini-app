import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { formatAchievementUnlockMessage } from './progressionToastMessages.js';
import { isGuidedOnboardingActive } from './progressionToastMessages.js';

describe('isGuidedOnboardingActive', () => {
  it('is true for draft and started', () => {
    assert.equal(isGuidedOnboardingActive('draft'), true);
    assert.equal(isGuidedOnboardingActive('started'), true);
  });

  it('is false after brief', () => {
    assert.equal(isGuidedOnboardingActive('brief_done'), false);
    assert.equal(isGuidedOnboardingActive(undefined), false);
  });
});

describe('formatAchievementUnlockMessage', () => {
  it('includes achievement title', () => {
    const msg = formatAchievementUnlockMessage({ title: 'Подушка' });
    assert.equal(msg, 'Достижение: Подушка');
  });

  it('falls back to default title', () => {
    assert.equal(formatAchievementUnlockMessage({}), 'Достижение: Достижение');
  });
});
