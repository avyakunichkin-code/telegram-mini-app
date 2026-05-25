import { MonetkaAvatar } from '../onboarding/MonetkaAvatar';

function GuidanceParagraph({ parts }) {
  if (!parts?.length) return null;
  return (
    <p className="mqx-goal-monetka__text">
      {parts.map((part, i) =>
        part.highlight != null ? (
          <strong key={i}>{part.highlight}</strong>
        ) : (
          <span key={i}>{part.text ?? ''}</span>
        ),
      )}
    </p>
  );
}

function guidanceForGoal(goal, view) {
  const type = goal?.type;
  const key = goal?.key;

  if (view.phase === 'win') {
    return {
      lead: [
        {
          text: 'Ты прошёл цепочку целей сценария — поздравляю! Можно продолжать играть или начать новую партию.',
        },
      ],
      tips: [],
    };
  }

  if (view.phase === 'gate') {
    return {
      lead: [
        { text: 'Все шаги цепочки закрыты. Победа засчитается с периода ' },
        { highlight: String(view.minPeriod ?? '—') },
        { text: ' — доживи до этой отметки на таймере.' },
      ],
      tips: [],
    };
  }

  if (view.phase === 'all_met' && view.nextGoalTitle) {
    return {
      lead: [
        { text: 'Класс, этот шаг закрыт ✓ Дальше — ' },
        { highlight: view.nextGoalTitle },
        { text: ', откроется в следующем периоде.' },
      ],
      tips: [],
    };
  }

  if (type === 'safety_fund_months' || key === 'safety_3x' || key === 'safety_6x') {
    return {
      lead: [
        { text: 'Откладывай в подушку каждый период не менее ' },
        { highlight: '10% от зарплаты' },
        { text: ' — так быстрее наберёшь сумму в ' },
        { highlight: '3× обязательств' },
        { text: '.' },
      ],
      tips: [
        'После «Зарплата» — «В подушку» в действиях периода.',
        'Не снимай с подушки без нужды.',
        'Полоска в chip «Подушка» — % от нормы (×3 обязательств сейчас), не цель сценария.',
      ],
    };
  }

  if (type === 'no_overdue' || key === 'no_overdue') {
    return {
      lead: [
        { text: 'Погашай обязательства ' },
        { highlight: 'в конце периода' },
        { text: ', пока хватает cash — иначе растёт ' },
        { highlight: 'просрочка' },
        { text: ' и шаг не засчитается.' },
      ],
      tips: [
        'Сначала зарплата и платежи по долгам, потом жизнь.',
        'Список платежей — в «Обязательства» на странице капитала.',
      ],
    };
  }

  if (type === 'net_monthly_cashflow_nonneg' || key === 'flow_nonneg') {
    return {
      lead: [
        { text: 'Забирай зарплату и следи, чтобы ' },
        { highlight: 'чистый поток за период был ≥ 0' },
        { text: ' — доходы перекрывают обязательные расходы.' },
      ],
      tips: [
        'Сначала «Зарплата», потом платежи по долгам, потом жизнь.',
        'Смотри chip «Доходы» на дашборде.',
      ],
    };
  }

  if (type === 'passive_income_monthly_min' || key === 'passive_income_100k') {
    return {
      lead: [
        { text: 'Наращивай ' },
        { highlight: 'инвестиции и доходные активы' },
        { text: ', чтобы пассивный доход достиг ' },
        { highlight: '100 000 ₽ в месяц' },
        { text: '.' },
      ],
      tips: [
        'Разделы «Инвестиции» и «Имущество» в управлении капиталом.',
        'Доход от активов приходит в конце периода.',
      ],
    };
  }

  if (type === 'passive_income_net_monthly_min') {
    return {
      lead: [
        { text: 'Доведи ' },
        { highlight: 'пассивный доход минус расходы на жизнь' },
        { text: ' до целевого уровня — считается в конце периода.' },
      ],
      tips: ['Снижай «Расходы» или наращивай доходные активы и инвестиции.'],
    };
  }

  if (type === 'asset_kind_any_owned') {
    return {
      lead: [
        { text: 'Купи нужный актив из ' },
        { highlight: 'шаблона в каталоге' },
        { text: ' — списание пойдёт с текущего счёта.' },
      ],
      tips: ['Смотри раздел «Имущество» в управлении капиталом.'],
    };
  }

  if (type === 'expense_to_income_ratio' || key === 'burn_ratio') {
    return {
      lead: [
        { text: 'Держи «Расходы на жизнь» не выше ' },
        { highlight: 'доли от дохода' },
        { text: ', заданной в условии цели.' },
      ],
      tips: ['Сравни chip «Доходы» и «Расходы» на дашборде.'],
    };
  }

  return {
    lead: [
      {
        text: goal?.title
          ? `Двигайся к цели «${goal.title}» шаг за шагом — смотри цифры в финансах периода.`
          : 'Следи за финансами периода и действиями внизу экрана.',
      },
    ],
    tips: [],
  };
}

/** @param {{ goal: object|null, view: object }} props */
export function GoalMonetkaGuidance({ goal, view }) {
  const copy = guidanceForGoal(goal, view);

  return (
    <div className="mqx-goal-monetka">
      <div className="mqx-goal-monetka__inner">
        <MonetkaAvatar size={44} className="mqx-goal-monetka__img" />
        <div className="mqx-goal-monetka__bubble">
          <h4 className="mqx-goal-monetka__title">Давай, помогу разобраться</h4>
          <GuidanceParagraph parts={copy.lead} />
          {copy.tips.length > 0 ? (
            <ul className="mqx-goal-monetka__tips">
              {copy.tips.map((tip) => (
                <li key={tip}>{tip}</li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </div>
  );
}
