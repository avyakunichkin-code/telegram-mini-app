const outcomes = {
  trip: ['−12 000 ₽ со счёта', 'Ты провёл время вместе. На подушку в этом месяце осталось меньше. Впечатления тоже могут быть осознанным выбором.'],
  save: ['12 000 ₽ остаются на счёте', 'Можно направить их в подушку. Поездку ты пропустил — стоит найти другой повод увидеться с друзьями.'],
  meet: ['−3 000 ₽ со счёта', 'В этом примере встреча в городе стоит 3 000 ₽. Ты увиделся с друзьями, а 9 000 ₽ от бюджета поездки остались на счёте.']
};
const result = document.querySelector('#result');
const reset = document.querySelector('#reset');
document.querySelectorAll('[data-choice]').forEach(button => button.addEventListener('click', () => {
  const [title, body] = outcomes[button.dataset.choice];
  result.replaceChildren();
  const strong = document.createElement('strong'); strong.textContent = title;
  const paragraph = document.createElement('p'); paragraph.textContent = body;
  result.append(strong, paragraph); result.hidden = false; reset.hidden = false;
  document.querySelector('.choices').hidden = true;
}));
reset.addEventListener('click', () => {
  result.hidden = true; reset.hidden = true; document.querySelector('.choices').hidden = false;
  document.querySelector('[data-choice]').focus();
});
