document.querySelector('.scenario-buttons').hidden = false;
const scenarios = {
 income: ['потеря дохода', 'На сколько хватит подушки?', 'Стресс-тест покажет, как изменится запас денег, если семья на шесть месяцев потеряет крупнейший доход.'],
 child: ['рождение ребёнка', 'Как изменится семейный бюджет?', 'Сценарий учитывает дополнительные расходы и снижение одного из доходов. Можно увидеть, где семье понадобится запас.'],
 prices: ['рост цен', 'Выдержит ли бюджет рост расходов?', 'Стресс-тест покажет, что произойдёт с запасом денег при увеличении расходов на 10 %.'],
 decision: ['ипотека или сочетание рисков', 'А если принять большое решение?', 'Для вопроса об ипотеке учитываются новый платёж и первоначальный взнос. Для остальных вопросов четвёртый сценарий сочетает потерю крупнейшего дохода и рост цен.']
};
function selectScenario(key) {
 const data = scenarios[key];
 document.querySelector('#scenario-label').textContent = 'Сценарий · ' + data[0];
 document.querySelector('#scenario-title').textContent = data[1];
 document.querySelector('#scenario-text').textContent = data[2];
 document.querySelector('#scenario-result').textContent = 'Срок до нехватки денег и минимальный остаток';
 document.querySelectorAll('[data-scenario]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.scenario === key)));
}
document.querySelectorAll('[data-scenario]').forEach(button => button.addEventListener('click', () => selectScenario(button.dataset.scenario)));
const questions = {
 mortgage: ['Вопрос · ипотека', 'Что останется после первого взноса?', 'В разборе ипотеки сопоставляются будущий платёж, долговая нагрузка и запас денег после первоначального взноса.'],
 debts: ['Вопрос · кредиты', 'Как быстрее закрыть долги?', 'Приложение сравнивает текущие платежи, «лавину» и «снежный ком»: сроки погашения и переплату.'],
 resilience: ['Вопрос · устойчивость', 'Что поможет пережить перемены?', 'В разборе можно сравнить сценарии потери дохода, рождения ребёнка и роста цен.'],
 goal: ['Вопрос · цель', 'Сколько откладывать каждый месяц?', 'Разбор сопоставляет необходимый взнос со свободными деньгами семьи и показывает реалистичность срока.']
};
document.querySelectorAll('[data-question]').forEach(button => button.addEventListener('click', () => {
 const data = questions[button.dataset.question];
 document.querySelector('#scenario-label').textContent = data[0];
 document.querySelector('#scenario-title').textContent = data[1];
 document.querySelector('#scenario-text').textContent = data[2];
 document.querySelector('#scenario-result').textContent = ({mortgage: 'Платёж, нагрузка и запас после взноса', debts: 'Срок погашения и переплата', resilience: 'Запас денег в стресс-сценариях', goal: 'Ежемесячный взнос и реалистичный срок'})[button.dataset.question];
 document.querySelectorAll('[data-scenario]').forEach(item => item.setAttribute('aria-pressed', 'false'));
 // Native anchor navigation also works without JavaScript.
}));

const roadmapVariant = new URLSearchParams(location.search).get('roadmap') === 'b' ? 'b' : 'a';
document.querySelector('#roadmap').classList.toggle('roadmap-editorial', roadmapVariant === 'b');
document.querySelectorAll('.roadmap-lab a').forEach(link => {
 if (new URL(link.href).searchParams.get('roadmap') === roadmapVariant) link.setAttribute('aria-current','page');
});
