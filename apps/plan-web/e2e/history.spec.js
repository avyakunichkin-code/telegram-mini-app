import { expect, test } from '@playwright/test'

async function login(page) {
  await page.goto('/')
  await page.getByLabel('E-mail').fill(`history-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`)
  await page.getByRole('button', { name: 'Получить код' }).click()
  await page.getByLabel('6 цифр').fill((await page.locator('.stub b').innerText()).trim())
  await page.getByRole('checkbox').check()
  await page.getByRole('button', { name: 'Войти' }).click()
  await expect(page.getByRole('button', { name: /Как у нас дела в целом/ })).toBeVisible()
}
async function seed(page, count = 3) {
  const ids = await page.evaluate(async count => {
    const call = async (path, body) => {
      const r = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('plan.token')}` }, body: JSON.stringify(body) })
      if (!r.ok) throw Error(`Seed ${r.status}`)
      return r.json()
    }
    const ids = []
    for (let i = 0; i < count; i++) {
      const ck = await call('/api/checkups', { entry_question: 'overview' })
      await call(`/api/checkups/${ck.id}/quick`, { income: { min: 200000 + i * 20000, max: 200000 + i * 20000 }, must_expenses: { min: 100000, max: 100000 }, debt_payments: { min: 0, max: 0 }, savings: { min: 100000 + i * 50000, max: 100000 + i * 50000 }, children: 0 })
      await call(`/api/checkups/${ck.id}/complete`)
      ids.push(ck.id)
    }
    return ids
  }, count)
  await page.reload()
  await expect(page.locator('.atlas-report')).toBeVisible()
  return ids
}
const profile = page => page.getByRole('navigation').getByRole('button', { name: 'Профиль', exact: true }).click()

test('approved journal: real history, pair controls, old report and latest offline copy', async ({ page, context }, testInfo) => {
  await login(page)
  const ids = await seed(page)
  await profile(page)
  await expect(page.locator('.h-metrics tbody tr')).toHaveCount(5)
  await expect(page.locator('.h-area')).toHaveCount(4)
  await expect(page.locator('.h-selectors select').last()).toHaveValue(ids[2])
  await page.getByRole('button', { name: 'С первым чекапом' }).click()
  await expect(page.locator('.h-margin-note')).toContainText(/40\s000/)
  await expect(page.locator('.h-selectors select').first()).toHaveValue(ids[0])
  await page.getByRole('button', { name: 'С предыдущим' }).click()
  await expect(page.locator('.h-margin-note')).toContainText(/20\s000/)
  for (const width of [375, 701, 1050, 1440]) {
    await page.setViewportSize({ width, height: 1000 })
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0)
  }
  await page.emulateMedia({ colorScheme: 'dark' })
  await page.screenshot({ path: testInfo.outputPath('journal-desktop.png'), fullPage: true })
  await page.setViewportSize({ width: 375, height: 1000 })
  await page.screenshot({ path: testInfo.outputPath('journal-mobile.png'), fullPage: true })
  await page.locator('.h-mobile-archive summary').click()
  await page.locator('.h-mobile-archive .h-record').last().getByRole('button').click()
  await expect(page.locator('#atlas-panel-answer .atlas-metrics article').first()).toContainText(/100\s000/)
  if (process.env.E2E_PREVIEW === '1') {
    await page.evaluate(async () => { await navigator.serviceWorker.ready })
    await context.setOffline(true)
    await page.reload()
    await expect(page.getByText(/Офлайн · только чтение/)).toBeVisible()
    await expect(page.locator('#atlas-panel-answer .atlas-metrics article').first()).toContainText(/140\s000/)
  }
})

test('loading/retry, comparison error, missing historical metric and versions', async ({ page }) => {
  await login(page); await seed(page)
  let release
  const gate = new Promise(resolve => { release = resolve })
  // Флаги, а не «первый запрос»: в dev StrictMode запускает эффект дважды, и первый запрос отменяется.
  let failList = true, failCompare = true
  await page.route('**/api/checkups', async route => {
    if (failList) { await gate; await route.fulfill({ status: 503, json: { error: { message: 'История временно недоступна' } } }) }
    else await route.continue()
  })
  await page.route('**/compare/*', async route => {
    if (failCompare) { await route.fulfill({ status: 503, json: { error: { message: 'Сравнение временно недоступно' } } }); return }
    const response = await route.fetch(), body = await response.json()
    body.versions_differ = true; body.before.rules_version = 0
    body.metrics[4].before = null; body.metrics[4].delta = null
    body.metrics[3].before = 999999999999; body.metrics[3].after = 888888888888; body.metrics[3].delta = -111111111111
    await route.fulfill({ json: body })
  })
  await profile(page)
  await expect(page.getByText('Загружаем историю…')).toBeVisible()
  release()
  await expect(page.getByRole('button', { name: 'Повторить загрузку' })).toBeVisible()
  failList = false
  await page.getByRole('button', { name: 'Повторить загрузку' }).click()
  await expect(page.getByRole('button', { name: 'Повторить сравнение' })).toBeVisible()
  failCompare = false
  await page.getByRole('button', { name: 'Повторить сравнение' }).click()
  await expect(page.getByText(/Версии расчёта различаются/)).toBeVisible()
  const row = page.locator('.h-metrics tbody tr').last()
  await expect(row).toContainText('Нет данных')
  await expect(row).toContainText('Нет сравнения')
  await page.setViewportSize({ width: 375, height: 1000 })
  await expect(page.locator('.h-wide-values')).toHaveCount(1)
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0)
})

test('empty and single-report history never offers an invalid pair', async ({ page }) => {
  await login(page); await profile(page)
  await expect(page.getByText('Здесь появится ваша история.')).toBeVisible()
  await seed(page, 1); await profile(page)
  await expect(page.getByText('У истории есть начало.')).toBeVisible()
  await expect(page.locator('.h-selectors')).toHaveCount(0)
  await page.getByRole('button', { name: 'Открыть первый отчёт' }).click()
  await expect(page.locator('.atlas-report')).toBeVisible()
})
