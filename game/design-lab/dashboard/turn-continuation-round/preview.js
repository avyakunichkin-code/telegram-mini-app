const messages = {
  tip: ['Зарплата за этот ход', 'Забери зарплату до завершения хода: пропущенная выплата не переносится.'],
  events: ['События', 'В этом ходу ждут решения два события.'],
  salary: ['Зарплата за этот ход', 'К получению 50 000 ₽. В макете баланс остаётся демонстрационным.'],
  close: ['Завершить ход', 'Со счёта спишется 30 000 ₽. После расчёта останется 12 000 ₽.'],
};

const dialog = document.querySelector('dialog');
document.querySelectorAll('[data-open]').forEach((button) => {
  button.addEventListener('click', () => {
    const [title, message] = messages[button.dataset.open];
    dialog.querySelector('h2').textContent = title;
    dialog.querySelector('p').textContent = message;
    dialog.showModal();
  });
});

const theme = document.querySelector('#theme');
theme.addEventListener('click', () => {
  const dark = document.documentElement.dataset.theme !== 'dark';
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  theme.setAttribute('aria-pressed', String(dark));
});
