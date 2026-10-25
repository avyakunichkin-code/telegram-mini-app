import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  buildTurnTip,
  eventsPlateHint,
  eventsPlateTitle,
  goalFinishText,
  goalStepCaption,
  incomeCell,
  lowestNeedAxis,
  pluralRu,
} from '../boardDashDisplay.js';
import { personaRoleTitle } from '../../brand/personaRoles.js';

describe('BG-1 dashboard display', () => {
  it('pluralizes events', () => {
    assert.equal(pluralRu(1, 'a', 'b', 'c'), 'a');
    assert.equal(pluralRu(21, 'a', 'b', 'c'), 'a');
    assert.equal(pluralRu(3, 'a', 'b', 'c'), 'b');
    assert.equal(pluralRu(12, 'a', 'b', 'c'), 'c');
    assert.equal(eventsPlateTitle(2), '2 события');
    assert.equal(eventsPlateTitle(5), '5 событий');
    assert.equal(eventsPlateTitle(1), '1 событие');
    assert.equal(eventsPlateTitle(0), 'События решены');
    assert.equal(eventsPlateHint(1), 'ждёт решения в этом ходу');
  });

  it('finds the lowest need axis', () => {
    assert.equal(lowestNeedAxis({ comfort: 70, status: 45, social: 60, health: 0 }).label, 'Здоровье');
    assert.equal(lowestNeedAxis({ enabled: false }), null);
    assert.equal(lowestNeedAxis(null), null);
  });

  it('tip priority: needs risk > overdue > salary > events > goal', () => {
    const goalView = { phase: 'active', currentGoal: { title: 'Открыть депозит' } };
    const base = { salaryAvailable: true, pendingEventsCount: 2, goalView };
    assert.deepEqual(
      buildTurnTip({
        ...base,
        needsZeroStreak: 1,
        overdueCount: 1,
        needs: { comfort: 0, status: 5, social: 5, health: 5 },
      }),
      { text: '«Комфорт» на нуле — позаботься о себе', tone: 'risk' },
    );
    assert.equal(buildTurnTip({ ...base, overdueCount: 2 }).tone, 'risk');
    assert.equal(buildTurnTip(base).text, 'Забери зарплату до конца хода');
    assert.equal(buildTurnTip({ ...base, salaryAvailable: false }).text, 'Реши события до конца хода');
    assert.equal(
      buildTurnTip({ ...base, salaryAvailable: false, pendingEventsCount: 0 }).text,
      'Шаг цели: Открыть депозит',
    );
    assert.equal(
      buildTurnTip({ goalView: { phase: 'gate', minPeriod: 7 } }).text,
      'Все шаги готовы. Победа с 7-го хода',
    );
    assert.equal(buildTurnTip({ goalView: { phase: 'win' } }).text, 'Победа! Можно играть дальше');
    assert.equal(buildTurnTip().text, 'Всё сделано — можно завершать ход');
  });

  it('goal captions follow the victory chain view', () => {
    assert.equal(goalStepCaption({ phase: 'active', currentIndex: 2, total: 5 }), 'шаг 3 из 5');
    assert.equal(goalStepCaption({ phase: 'gate', currentIndex: 4, total: 5 }), 'все шаги готовы');
    assert.equal(goalStepCaption({ phase: 'win', currentIndex: 4, total: 5 }), 'победа');
    assert.equal(goalStepCaption({ total: 0 }), '');
    assert.equal(goalFinishText({ phase: 'active', minPeriod: 7 }), 'Победа с 7-го хода — игра продолжится');
    assert.equal(goalFinishText({ phase: 'win', minPeriod: 7 }), 'Победа — игра продолжается');
    assert.equal(goalFinishText({ phase: 'active', minPeriod: 1 }), 'Финиш — победа, игра продолжится');
  });

  it('income cell is always «Доходы за ход» from all sources (★ BG-3)', () => {
    assert.deepEqual(
      incomeCell({ total_monthly_income: 62500, salary: { monthly_amount: 62500 } }),
      { label: 'Доходы за ход', value: 62500 },
    );
    assert.deepEqual(
      incomeCell({ total_monthly_income: 70000, salary: { monthly_amount: 62500 } }),
      { label: 'Доходы за ход', value: 70000 },
    );
    assert.deepEqual(incomeCell({ salary: { monthly_amount: 62500 } }), { label: 'Доходы за ход', value: 62500 });
  });

  it('maps template keys to role titles', () => {
    assert.equal(personaRoleTitle('mq_game_basic_v1'), 'Студент');
    assert.equal(personaRoleTitle('unknown'), 'Игрок');
  });
});
