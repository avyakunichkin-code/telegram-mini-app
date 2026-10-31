import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  lifeIncomePerTurn,
  lifeStartConditions,
  lifeStartLabel,
  roleAccusative,
  runOutcomeLabel,
  savesCountHint,
} from '../pregameDisplay.js';

describe('BG-2 pre-game display', () => {
  it('turns monthly salary highlight into income per turn', () => {
    assert.equal(lifeIncomePerTurn(['Зарплата ~62 500 ₽/мес', 'Только депозиты']), '~62 500 ₽ за ход');
    assert.equal(lifeIncomePerTurn(['Доход ~100 000 ₽/мес']), '~100 000 ₽ за ход');
    assert.equal(lifeIncomePerTurn(['Без зарплаты']), null);
    assert.equal(lifeIncomePerTurn(undefined), null);
  });

  it('takes start conditions from the non-money highlight, else description', () => {
    assert.equal(
      lifeStartConditions({ highlights: ['Зарплата ~200 000 ₽/мес', 'Ипотека, два авто и кредитная карта'] }),
      'Ипотека, два авто и кредитная карта',
    );
    assert.equal(
      lifeStartConditions({ highlights: ['Зарплата ~62 500 ₽/мес'], description: 'Первый бюджет без долгов' }),
      'Первый бюджет без долгов',
    );
    assert.equal(lifeStartConditions({ highlights: [] }), null);
  });

  it('names the start action in accusative', () => {
    assert.equal(roleAccusative('Студент'), 'Студента');
    assert.equal(roleAccusative('Профессионал'), 'Профессионала');
    assert.equal(roleAccusative('Предприниматель'), 'Предпринимателя');
    assert.equal(lifeStartLabel('Руководитель'), 'Начать за Руководителя');
    assert.equal(lifeStartLabel(''), 'Начать игру');
  });

  it('pluralizes saves and labels outcomes without save kind', () => {
    assert.equal(savesCountHint(1), '1 партия');
    assert.equal(savesCountHint(3), '3 партии');
    assert.equal(savesCountHint(5), '5 партий');
    assert.equal(savesCountHint(0), null);
    assert.equal(runOutcomeLabel({ run_outcome: 'victory' }), 'Победа');
    assert.equal(runOutcomeLabel({ is_archived: 1, is_active: 0 }), 'Поражение');
    assert.equal(runOutcomeLabel({ is_active: 1 }), null);
  });
});
