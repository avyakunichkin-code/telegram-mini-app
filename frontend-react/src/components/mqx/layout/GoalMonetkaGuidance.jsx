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

  if (type === 'action_once') {
    const action = goal?.detail?.action || '';
    if (action === 'salary_claimed' || key === 'tutorial_salary') {
      return {
        lead: [{ text: 'Нажми «Зарплата» в действиях периода — это первый шаг сценария.' }],
        tips: ['Без зарплаты в периоде доход не засчитается в поток.'],
      };
    }
    if (action === 'safety_contributed' || key === 'tutorial_cushion') {
      return {
        lead: [
          { text: 'Переведи любую сумму в ' },
          { highlight: 'подушку безопасности' },
          { text: ' — кнопка «В подушку» на дашборде.' },
        ],
        tips: ['После этого откроется раздел инвестиций.'],
      };
    }
    if (action === 'invest_opened' || key === 'tutorial_invest') {
      return {
        lead: [
          { text: 'Открой ' },
          { highlight: 'депозит или облигацию' },
          { text: ' в «Управление капиталом» → Инвестиции.' },
        ],
        tips: ['Достаточно одной позиции — шаг засчитается сразу.'],
      };
    }
    if (action === 'insurance_purchased' || key === 'tutorial_insurance') {
      return {
        lead: [
          { text: 'Оформи ' },
          { highlight: 'страховой полис' },
          { text: ' в разделе «Страховки».' },
        ],
        tips: ['После этого откроется покупка имущества из каталога.'],
      };
    }
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
        'Полоска в chip «Фин.подушка» — % от нормы (×3 всех расходов за период), не цель сценария.',
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

  if (type === 'passive_income_monthly_min' || key === 'invest_income_15k' || key === 'passive_income_100k') {
    const target = goal?.detail?.min_monthly;
    const targetLabel =
      typeof target === 'number' && target > 0
        ? `${Math.round(target).toLocaleString('ru-RU')} ₽ в месяц`
        : 'целевого уровня';
    return {
      lead: [
        { text: 'Держи ' },
        { highlight: 'депозит или облигации' },
        { text: ', чтобы доход с инвестиций достиг ' },
        { highlight: targetLabel },
        { text: '.' },
      ],
      tips: [
        'Только инвестиции в этом сценарии — без недвижимости.',
        'Купоны и %% капитализируются в конце периода.',
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
