import assert from 'node:assert/strict';
import { readResumeScreen, rememberScreen } from './gameScreenSession.js';

function memoryStorage() {
  const map = new Map();
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
  };
}

// Партия открыта → после перезагрузки снова партия.
{
  const s = memoryStorage();
  assert.equal(readResumeScreen(s), 'start');
  rememberScreen('game', s);
  assert.equal(readResumeScreen(s), 'game');
}

// Вышли в меню / выбор жизни — после перезагрузки меню.
for (const screen of ['start', 'newGame', 'gameTemplates']) {
  const s = memoryStorage();
  rememberScreen('game', s);
  rememberScreen(screen, s);
  assert.equal(readResumeScreen(s), 'start', screen);
}

// Хранилище недоступно (private mode, throw) — без падений, с меню.
{
  const broken = {
    getItem() {
      throw new Error('blocked');
    },
    setItem() {
      throw new Error('blocked');
    },
    removeItem() {
      throw new Error('blocked');
    },
  };
  rememberScreen('game', broken);
  assert.equal(readResumeScreen(broken), 'start');
  assert.equal(readResumeScreen(null), 'start');
}

console.log('gameScreenSession: ok');
