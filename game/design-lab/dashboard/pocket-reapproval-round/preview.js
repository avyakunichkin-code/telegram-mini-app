const dialog = document.querySelector('#message');
const salary = document.querySelector('#salary');
function show(title, body) {
  dialog.querySelector('h2').textContent = title;
  dialog.querySelector('p').textContent = body;
  dialog.showModal();
}
document.querySelector('#help').onclick = () => {
  if (salary.disabled) show('События ждут решения', 'Открой события и выбери, как поступить в этом ходу.');
  else show('Зарплата за этот ход', 'Забери зарплату до завершения хода: пропущенная выплата не переносится.');
};
document.querySelector('#events').onclick = () => show('Два события ждут решения', 'Это демонстрационное состояние колоды на восьмом ходу.');
salary.onclick = () => {
  salary.textContent = 'Зарплата получена';
  salary.disabled = true;
  document.querySelector('.mqx-pocket-balance .mq-money__value').textContent = '92 000';
  document.querySelectorAll('.mqx-pocket-forecast .mq-money__value')[1].textContent = '62 000';
  const portrait = document.querySelector('#help picture');
  portrait.querySelector('source').srcset = './assets/coin-surprised-avatar.webp';
  portrait.querySelector('img').src = './assets/coin-surprised-avatar.png';
};
document.querySelector('#theme').onclick = () => {
  const root = document.documentElement;
  root.dataset.theme = root.dataset.theme === 'light' ? 'dark' : 'light';
};
