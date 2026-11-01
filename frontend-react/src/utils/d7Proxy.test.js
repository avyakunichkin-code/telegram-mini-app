import assert from 'node:assert/strict';
import { D7_MIN_SAMPLE, d7ProxyTile } from './d7Proxy.js';

// Нет знаменателя — прочерк, а не 0%.
assert.deepEqual(d7ProxyTile({ d7_eligible: 0, d7_returned: 0 }), { value: '—', sub: 'нет игроков старше 7 дней' });
assert.deepEqual(d7ProxyTile(null), { value: '—', sub: 'нет игроков старше 7 дней' });
// Малая выборка — процент с предупреждением.
assert.deepEqual(d7ProxyTile({ d7_eligible: 3, d7_returned: 1 }), {
  value: '33%',
  sub: `1 из 3 · мало данных (n<${D7_MIN_SAMPLE})`,
});
// Достаточная выборка — без предупреждения.
assert.deepEqual(d7ProxyTile({ d7_eligible: 50, d7_returned: 6 }), { value: '12%', sub: '6 из 50' });
