import assert from 'node:assert/strict';
import test from 'node:test';
import { splitContinueHint } from './continueHint.js';

test('последний абзац «Нажми «Понятно»» уходит в подпись под кнопкой', () => {
  const body = 'Игра идёт **ходами**.\n\nСейчас просто осмотрись.\n\n**Нажми «Понятно»**, когда готов двигаться дальше.';
  assert.deepEqual(splitContinueHint(body), {
    main: 'Игра идёт **ходами**.\n\nСейчас просто осмотрись.',
    hint: '**Нажми «Понятно»**, когда готов двигаться дальше.',
  });
});

test('короткая подпись «Нажми «Понятно»».', () => {
  assert.deepEqual(splitContinueHint('Текст.\n\n**Нажми «Понятно»**.'), { main: 'Текст.', hint: '**Нажми «Понятно»**.' });
});

test('без такого абзаца текст не меняется', () => {
  const body = 'Сейчас: нажми на события вверху карточки хода.';
  assert.deepEqual(splitContinueHint(body), { main: body, hint: null });
});

test('«Нажми «Понятно»» не в последнем абзаце — не трогаем', () => {
  const body = '**Нажми «Понятно»**, а потом зарплату.\n\nИ ещё абзац.';
  assert.deepEqual(splitContinueHint(body), { main: body, hint: null });
});

test('пустой текст', () => {
  assert.deepEqual(splitContinueHint(undefined), { main: '', hint: null });
});
