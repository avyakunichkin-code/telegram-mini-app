import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { formatAchievementUnlockMessage } from './progressionToastMessages.js';

describe('formatAchievementUnlockMessage', () => {
  it('includes title and xp', () => {
    const msg = formatAchievementUnlockMessage({ title: 'Подушка', xp_reward: 12 });
    assert.equal(msg, 'Достижение: Подушка · +12 XP');
  });

  it('includes level-up suffix', () => {
    const msg = formatAchievementUnlockMessage({
      title: 'Стабильность',
      xp_gained: 8,
      level_up: true,
      new_level: 3,
    });
    assert.match(msg, /\+8 XP/);
    assert.match(msg, /уровень 3/);
  });

  it('falls back to default title', () => {
    assert.equal(formatAchievementUnlockMessage({}), 'Достижение: Достижение');
  });
});
