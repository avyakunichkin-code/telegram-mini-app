import { getLang } from './i18n.js';
import {
  animateMoney,
  formatMoney,
  formatTimer,
  prefersReducedMotion,
  sleep,
} from './demo-utils.js';

const CASH_START = 42500;
const CASH_AFTER_SALARY = 58500;
const TIMER_START_SEC = 4 * 60 + 12;

let runId = 0;
let timerInterval = null;

function $(id) {
  return document.getElementById(id);
}

function clearTimerInterval() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function resetDom() {
  const root = $('hero-demo');
  if (!root) return;

  root.classList.remove('mq-demo--active');
  $('demo-salary')?.classList.remove('mq-demo-highlight', 'mq-demo-press');
  $('demo-choice-a')?.classList.remove('mq-demo-highlight', 'mq-demo-press', 'mq-demo-choice--picked');
  $('demo-choice-b')?.classList.remove('mq-demo-highlight', 'mq-demo-press');

  const toast = $('demo-toast');
  const event = $('demo-event');
  if (toast) toast.hidden = true;
  if (event) event.hidden = true;

  const cash = $('demo-cash');
  if (cash) cash.textContent = formatMoney(CASH_START, getLang());

  const timer = $('hero-timer');
  if (timer) timer.textContent = formatTimer(TIMER_START_SEC);
}

function startTimerTick() {
  clearTimerInterval();
  const timer = $('hero-timer');
  if (!timer) return;

  let sec = TIMER_START_SEC;
  timerInterval = setInterval(() => {
    sec = sec > 0 ? sec - 1 : TIMER_START_SEC;
    timer.textContent = formatTimer(sec);
  }, 1000);
}

async function pulse(el, className, ms = 180) {
  if (!el) return;
  el.classList.add(className);
  await sleep(ms);
  el.classList.remove(className);
}

async function runScenario() {
  const id = ++runId;
  const lang = getLang();
  const cashEl = $('demo-cash');
  const salaryBtn = $('demo-salary');
  const toast = $('demo-toast');
  const eventPanel = $('demo-event');
  const choiceA = $('demo-choice-a');

  if (!cashEl || !salaryBtn) return;

  resetDom();
  $('hero-demo')?.classList.add('mq-demo--active');
  startTimerTick();

  await sleep(2200);
  if (id !== runId) return;

  salaryBtn.classList.add('mq-demo-highlight');
  await sleep(600);
  if (id !== runId) return;

  await pulse(salaryBtn, 'mq-demo-press', 200);
  if (id !== runId) return;

  if (toast) {
    toast.hidden = false;
    toast.classList.add('mq-demo-toast--in');
  }
  cashEl.classList.add('mq-demo-cash-bump');
  await animateMoney(cashEl, CASH_START, CASH_AFTER_SALARY, lang);
  cashEl.classList.remove('mq-demo-cash-bump');
  if (id !== runId) return;

  await sleep(900);
  if (id !== runId) return;

  salaryBtn.classList.remove('mq-demo-highlight');
  if (toast) {
    toast.classList.remove('mq-demo-toast--in');
    await sleep(280);
    toast.hidden = true;
  }

  if (eventPanel) {
    eventPanel.hidden = false;
    eventPanel.classList.add('mq-demo-event--in');
  }
  await sleep(1400);
  if (id !== runId) return;

  choiceA?.classList.add('mq-demo-highlight');
  await sleep(500);
  if (id !== runId) return;

  await pulse(choiceA, 'mq-demo-press', 200);
  choiceA?.classList.add('mq-demo-choice--picked');
  if (id !== runId) return;

  await sleep(1200);
  if (id !== runId) return;

  if (eventPanel) {
    eventPanel.classList.remove('mq-demo-event--in');
    await sleep(300);
    eventPanel.hidden = true;
  }
  choiceA?.classList.remove('mq-demo-highlight', 'mq-demo-choice--picked');

  cashEl.textContent = formatMoney(CASH_START, lang);
  await sleep(400);
  if (id !== runId) return;

  runScenario();
}

function showStaticEndState() {
  clearTimerInterval();
  const lang = getLang();
  const cashEl = $('demo-cash');
  const timer = $('hero-timer');
  const eventPanel = $('demo-event');
  const choiceA = $('demo-choice-a');

  if (cashEl) cashEl.textContent = formatMoney(CASH_AFTER_SALARY, lang);
  if (timer) timer.textContent = formatTimer(TIMER_START_SEC);
  if (eventPanel) {
    eventPanel.hidden = false;
    eventPanel.classList.add('mq-demo-event--in');
  }
  choiceA?.classList.add('mq-demo-choice--picked');
  $('hero-demo')?.classList.add('mq-demo--active');
}

/** Запуск / перезапуск после смены языка */
export function initHeroDemo() {
  if (!$('hero-demo')) return;

  runId += 1;
  clearTimerInterval();
  resetDom();

  if (prefersReducedMotion()) {
    showStaticEndState();
    return;
  }

  runScenario();
}

export function stopHeroDemo() {
  runId += 1;
  clearTimerInterval();
  resetDom();
}
