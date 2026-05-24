import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { formatAchievementUnlockMessage } from './progressionToastMessages.js';

describe('formatAchievementUnlockMessage', () => {
  it('includes achievement title', () => {
    const msg = formatAchievementUnlockMessage({ title: 'Подушка' });
    assert.equal(msg, 'Достижение: Подушка');
  });

  it('falls back to default title', () => {
    assert.equal(formatAchievementUnlockMessage({}), 'Достижение: Достижение');
  });
});
