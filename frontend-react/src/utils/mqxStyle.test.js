import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { DEFAULT_MQX_STYLE, resolveMqxStyle } from './mqxStyle.js';

describe('mqxStyle — выбор стиля интерфейса', () => {
  it('по умолчанию — чернильный край', () => {
    assert.equal(DEFAULT_MQX_STYLE, 'ink');
    assert.deepEqual(resolveMqxStyle('', null), { style: 'ink', persist: false });
  });

  it('?style=classic из адреса побеждает сохранённый и запоминается', () => {
    assert.deepEqual(resolveMqxStyle('?style=classic', 'ink'), { style: 'classic', persist: true });
  });

  it('без параметра берёт сохранённый', () => {
    assert.deepEqual(resolveMqxStyle('', 'classic'), { style: 'classic', persist: false });
  });

  it('неизвестные значения игнорируются', () => {
    assert.deepEqual(resolveMqxStyle('?style=neon', 'retro'), { style: 'ink', persist: false });
  });
});
