const modes = document.querySelectorAll('[data-mode]');
const minimum = document.querySelector('#min');
const maximum = document.querySelector('#max');
const status = document.querySelector('#save-status');
let mode = 'range';
function setMode(value) {
  mode = value;
  modes.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.mode === mode)));
  document.querySelector('#max-field').hidden = mode === 'exact';
  document.querySelector('#min-label').textContent = mode === 'exact' ? 'Сумма' : 'От';
  document.querySelector('#precision').textContent = mode === 'exact' ? 'Уточнённые данные' : 'Приблизительные данные';
  status.textContent = 'Демонстрация ввода, без отправки данных.';
  status.classList.remove('error');
}
modes.forEach(button => button.addEventListener('click', () => setMode(button.dataset.mode)));
document.querySelector('#save').addEventListener('click', () => {
  const lo = minimum.value.trim(), hi = maximum.value.trim();
  const valid = /^\d+$/.test(lo) && (mode === 'exact' || /^\d+$/.test(hi) && Number(hi) >= Number(lo));
  status.classList.toggle('error', !valid);
  status.textContent = valid ? 'Готово в примере. Данные никуда не отправлялись.' : 'Проверьте суммы: нужны целые неотрицательные значения, «До» не меньше «От».';
});
document.querySelector('#reset').addEventListener('click', () => {
  minimum.value = '90000'; maximum.value = '100000'; setMode('range');
});
document.querySelectorAll('.side button').forEach(button => button.addEventListener('click', () => {
  status.textContent = 'В этом образце доступен только раздел «Расходы». Другие разделы показаны для сравнения цветов.';
}));
const fmt = n => new Intl.NumberFormat('ru-RU').format(n);
document.querySelector('#forecast-values').innerHTML = Array.from({ length: 12 }, (_, i) => `<tr><th scope="row">${i + 1}</th><td>${fmt(270000 + (i + 1) * 45000)}</td><td>${fmt(270000 + (i + 1) * 13500)}</td></tr>`).join('');
