import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildLevelProgressHint } from './levelProgressHint.js';

describe('buildLevelProgressHint', () => {
  it('returns max variant when need is zero', () => {
    const hint = buildLevelProgressHint({
      character_level: 12,
      character_xp: 0,
      character_xp_need_for_next: 0,
    });
    assert.equal(hint.variant, 'max');
    assert.match(hint.text, /Максимальный уровень/);
    assert.equal(hint.remaining, 0);
  });

  it('shows remaining XP and next unlock on same level', () => {
    const hint = buildLevelProgressHint({
      character_level: 2,
      character_xp: 30,
      character_xp_need_for_next: 50,
      character_unlocks: [
        { min_level: 3, label: 'Облигации', unlocked: false },
        { min_level: 3, label: 'Депозит', unlocked: false },
      ],
    });
    assert.equal(hint.variant, 'progress');
    assert.equal(hint.remaining, 20);
    assert.equal(hint.nextLevel, 3);
    assert.match(hint.text, /Ещё 20 XP до 3 уровня/);
    assert.match(hint.text, /Облигации/);
  });

  it('mentions unlock on a later level', () => {
    const hint = buildLevelProgressHint({
      character_level: 1,
      character_xp: 0,
      character_xp_need_for_next: 40,
      character_unlocks: [{ min_level: 5, label: 'Инвестиции', unlocked: false }],
    });
    assert.match(hint.text, /на 5 уровне/);
    assert.match(hint.text, /Инвестиции/);
  });
});
