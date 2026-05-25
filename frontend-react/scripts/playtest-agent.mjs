/**
 * Playtest для агента. node scripts/playtest-agent.mjs
 */
import { chromium } from 'playwright';
import { writeFileSync } from 'fs';

const BASE = process.env.PLAYTEST_URL || 'http://localhost:5173/telegram-mini-app/';
const API = process.env.PLAYTEST_API || 'https://telegram-mini-app-zwfs.onrender.com';
const suffix = Date.now().toString(36);
const username = `playtest_${suffix}`;
const email = `${username}@playtest.local`;
const password = 'Playtest1!';

const findings = [];
const log = (level, msg) => {
  findings.push({ level, msg });
  console.log(`[${level}] ${msg}`);
};

async function apiRegister() {
  const res = await fetch(`${API}/api/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password, password_confirm: password }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`register ${res.status}: ${text.slice(0, 300)}`);
  return JSON.parse(text);
}

async function snap(page, name) {
  const path = `scripts/playtest-${name}.png`;
  await page.screenshot({ path, fullPage: true });
  return path;
}

async function waitAuthReady(page) {
  await page.waitForFunction(
    () => {
      const loading = document.querySelector('#mqx-auth-loading-title');
      const start = document.querySelector('#mqx-start-menu-title');
      const login = document.querySelector('#mqx-login-monetka-title');
      return start || login || (loading == null && document.querySelector('form'));
    },
    { timeout: 45000 },
  );
}

async function main() {
  await apiRegister();
  log('info', `Аккаунт: ${username}`);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    locale: 'ru-RU',
  });

  const consoleMsgs = [];
  const networkFails = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error' || msg.type() === 'warning') {
      consoleMsgs.push({ type: msg.type(), text: msg.text() });
    }
  });
  page.on('response', (res) => {
    if (res.url().includes('/api/') && res.status() >= 400) {
      networkFails.push({ status: res.status(), url: res.url(), method: res.request().method() });
    }
  });

  await page.goto(`${BASE}#/login`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.locator('#login-email').fill(email);
  await page.locator('#login-password').fill(password);
  await page.getByRole('button', { name: /^войти$/i }).click();
  try {
    await page.waitForURL(/#\/(\?.*)?$/, { timeout: 60000 });
    await page.waitForSelector('#mqx-start-menu-title', { timeout: 60000 });
  } catch (e) {
    const errText = await page.locator('.mqx-auth-monetka__error, [role="alert"]').allTextContents().catch(() => []);
    log('error', `Вход не завершился: ${e.message}; UI: ${errText.join(' | ') || '—'}`);
    await snap(page, 'after-login');
    await browser.close();
    process.exit(1);
  }
  await snap(page, 'after-login');

  await page.getByRole('button', { name: /^новая игра$/i }).waitFor({ timeout: 60000 });
  const title = await page.locator('#mqx-start-menu-title').textContent();
  log('info', `Меню: ${title?.trim()}`);

  const newGame = page.getByRole('button', { name: /^новая игра$/i });
  if (await newGame.count()) {
    await newGame.click();
    await page.waitForTimeout(600);
    await snap(page, 'profile-kind');
  }

  await page.getByRole('button', { name: /игра.*шаблон/i }).click({ timeout: 10000 });
  await page.waitForSelector('#mqx-new-game-templates-title', { timeout: 15000 });
  await snap(page, 'templates');

  const quickStart = page.getByRole('button', { name: /быстрый старт/i });
  if (await quickStart.count()) {
    await quickStart.first().click({ timeout: 15000 });
    log('info', 'Быстрый старт');
  } else {
    const firstScenario = page.locator('[data-template-key], .mqx-starter-scenario, button').filter({
      hasText: /обучен|tutorial|лайт|лёгк|старт/i,
    });
    if (await firstScenario.count()) {
      await firstScenario.first().click({ timeout: 10000 }).catch(() => {});
      log('info', 'Выбран шаблон по тексту');
    }
  }

  await page.waitForTimeout(4000);
  await snap(page, 'game');

  const inGame =
    (await page.locator('.mq-bottom-nav, .pg-game-screen, [data-tab]').count()) > 0 ||
    (await page.getByText(/период\s*\d|забрать зарплату/i).count()) > 0;

  log('info', inGame ? 'В игровом UI' : 'Игровой UI не распознан');

  if (inGame) {
    const salary = page.getByRole('button', { name: /забрать зарплату|зарплат/i });
    if (await salary.count()) {
      await salary.first().click().catch(() => {});
      await page.waitForTimeout(800);
      log('info', 'Зарплата');
    }

    for (let i = 0; i < 8; i++) {
      const onboardingNext = page.getByRole('button', { name: /далее|понятно|продолжить|готово|пропустить/i });
      if (await onboardingNext.count()) {
        await onboardingNext.first().click().catch(() => {});
        await page.waitForTimeout(400);
        log('info', `Онбординг шаг ${i + 1}`);
      } else break;
    }

    const eventsBtn = page.getByRole('button', { name: /событ/i });
    if (await eventsBtn.count()) {
      await eventsBtn.first().click().catch(() => {});
      await page.waitForTimeout(600);
      const choice = page.locator('button').filter({ hasText: /^(да|нет|выбрать|принять|ок)$/i }).first();
      if (await choice.count()) {
        await choice.click().catch(() => {});
        log('info', 'Событие: выбор');
      }
      await page.keyboard.press('Escape').catch(() => {});
      await snap(page, 'events');
    }

    for (const tab of ['Финансы', 'Аналитика', 'Цели', 'Меню', 'Главная']) {
      const el = page.getByRole('button', { name: new RegExp(tab, 'i') });
      if (await el.count()) {
        await el.first().click({ timeout: 3000 }).catch(() => {});
        await page.waitForTimeout(500);
      }
    }
    await snap(page, 'tabs');

    const nextPeriod = page.getByRole('button', { name: /дальше|следующий период|закрыть период|закрыть месяц/i });
    if (await nextPeriod.count()) {
      log('info', 'Есть переход периода');
    }

    const overlays = await page.locator('[role="dialog"], .mqx-period-close, .tgui-modal').count();
    if (overlays > 0) log('info', `Открытых оверлеев/модалок: ${overlays}`);
  }

  const body = await page.locator('body').innerText();
  const errorLines = body
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => /ошибк|не удалось|что-то пошло|error/i.test(l));
  for (const line of errorLines.slice(0, 8)) log('warn', `Текст UI: ${line.slice(0, 140)}`);

  if (consoleMsgs.length) {
    for (const m of consoleMsgs.slice(0, 12)) log(m.type === 'error' ? 'error' : 'warn', `Console: ${m.text.slice(0, 280)}`);
  }

  if (networkFails.length) {
    for (const f of networkFails.slice(0, 12)) log('error', `API ${f.status} ${f.method} ${f.url.replace(API, '')}`);
  }

  writeFileSync(
    'scripts/playtest-report.json',
    JSON.stringify({ username, findings, consoleMsgs, networkFails }, null, 2),
  );

  await browser.close();
  console.log('\n--- ИТОГ ---');
  for (const f of findings) console.log(`${f.level}: ${f.msg}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
