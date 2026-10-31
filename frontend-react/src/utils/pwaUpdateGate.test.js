import assert from 'node:assert/strict';
import { createPwaUpdateGate } from './pwaUpdateGate.js';

function makeGate() {
  const calls = { apply: 0, notify: 0 };
  const gate = createPwaUpdateGate({
    apply: () => {
      calls.apply += 1;
    },
    notify: () => {
      calls.notify += 1;
    },
  });
  return { gate, calls };
}

// В партии: новая версия ждёт, игрок видит одно уведомление, перезагрузки нет.
{
  const { gate, calls } = makeGate();
  gate.needRefresh();
  gate.needRefresh();
  assert.equal(calls.apply, 0);
  assert.equal(calls.notify, 1);
  assert.equal(gate.isReady(), true);
}

// Граница хода ставит ожидающую версию; без версии — ничего.
{
  const { gate, calls } = makeGate();
  gate.turnBoundary();
  assert.equal(calls.apply, 0);
  gate.needRefresh();
  gate.turnBoundary();
  gate.turnBoundary();
  assert.equal(calls.apply, 1);
}

// Меню: версия ставится сразу, без уведомления — в обоих порядках событий.
{
  const { gate, calls } = makeGate();
  gate.setSafeZone(true);
  gate.needRefresh();
  assert.equal(calls.apply, 1);
  assert.equal(calls.notify, 0);
}
{
  const { gate, calls } = makeGate();
  gate.needRefresh();
  gate.setSafeZone(true);
  assert.equal(calls.apply, 1);
}

// Ушли из меню в игру до появления версии — снова ждём границы хода.
{
  const { gate, calls } = makeGate();
  gate.setSafeZone(true);
  gate.setSafeZone(false);
  gate.needRefresh();
  assert.equal(calls.apply, 0);
  assert.equal(calls.notify, 1);
}

console.log('pwaUpdateGate: ok');
