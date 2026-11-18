import { expect, test } from '@playwright/test'

const reserve = page => page.locator('#atlas-panel-answer .atlas-metrics article').filter({ hasText: 'Резерв семьи' }).locator('strong')

async function setup(page) {
  await page.goto('/')
  await page.getByLabel('E-mail').fill(`bridge-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`)
  await page.getByRole('button', { name: 'Получить код' }).click()
  await page.getByLabel('6 цифр').fill((await page.locator('.stub b').innerText()).trim())
  await page.getByRole('checkbox').check()
  await page.getByRole('button', { name: 'Войти' }).click()
  await expect(page.getByRole('button', { name: /Как у нас дела в целом/ })).toBeVisible()
  const result = await page.evaluate(async () => {
    const call = async (method, path, body) => {
      const r = await fetch(path, { method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('plan.token')}` }, body: body && JSON.stringify(body) })
      if (!r.ok) throw Error(`Seed ${r.status}`)
      return r.json()
    }
    const quick = savings => ({ income: { min: 124000, max: 124000 }, must_expenses: { min: 100000, max: 100000 }, debt_payments: { min: 0, max: 0 }, savings: { min: savings, max: savings }, children: 0 })
    const old = await call('POST', '/api/checkups', { entry_question: 'overview' })
    await call('POST', `/api/checkups/${old.id}/quick`, quick(40000))
    const parent = await call('POST', `/api/checkups/${old.id}/complete`)
    const step = parent.steps.find(s => s.rule_key === 'first_cushion')
    for (const a of step.actions) await call('PATCH', `/api/steps/${step.id}/actions/${a.key}`, { done: true })
    const child = await call('POST', '/api/checkups', { entry_question: 'overview' })
    await call('POST', `/api/checkups/${child.id}/quick`, quick(120000))
    const report = await call('POST', `/api/checkups/${child.id}/complete`)
    // Changing the parent after the new final must not change the frozen bridge.
    await call('PATCH', `/api/steps/${step.id}`, { status: 'dismissed' })
    return { old: old.id, child: child.id, first: report.steps[0].title }
  })
  await page.reload()
  await expect(page.locator('.previous-bridge')).toBeVisible()
  return result
}

test('bridge uses frozen parent, separate actions, past report/back and offline', async ({ page, context }, testInfo) => {
  const seeded = await setup(page)
  await expect(page.locator('.previous-page')).toContainText('Шаг отмечен завершённым')
  await expect(page.locator('.previous-values')).toContainText('0,4 мес.')
  await expect(page.locator('.previous-values')).toContainText('1,2 мес.')
  await expect(page.locator('.previous-current')).toContainText(seeded.first)
  await expect(page.locator('.previous-current')).toContainText('Выполнено 0 из 3')
  for (const width of [375, 701, 1050, 1440]) {
    await page.setViewportSize({ width, height: 1000 })
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0)
  }
  await page.screenshot({ path: testInfo.outputPath('bridge-desktop.png'), fullPage: true })
  await page.setViewportSize({ width: 375, height: 1000 })
  await page.screenshot({ path: testInfo.outputPath('bridge-mobile.png'), fullPage: true })
  await page.getByRole('button', { name: 'Открыть прошлый отчёт ↗' }).click()
  await expect(reserve(page)).toContainText('0,4')
  await page.getByRole('button', { name: '← К новому разбору' }).click()
  await expect(reserve(page)).toContainText('1,2')
  if (process.env.E2E_PREVIEW === '1') {
    await page.evaluate(async () => { await navigator.serviceWorker.ready })
    await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('plan.last-report.v1'))?.checkup.id)).toBe(seeded.child)
    await context.setOffline(true); await page.reload()
    await expect(page.locator('.previous-bridge')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Открыть прошлый отчёт ↗' })).toBeDisabled()
    await expect(page.locator('.previous-page')).toContainText('Шаг отмечен завершённым')
  }
})

test('unavailable parent and missing metric do not block the current report', async ({ page }) => {
  await setup(page)
  let unavailable = false
  await page.route('**/api/checkups/*/report', async route => {
    const response = await route.fetch(), body = await response.json()
    if (unavailable) body.previous_steps = { status: 'unavailable', steps: [] }
    else {
      body.previous_steps.versions_differ = true
      body.previous_steps.steps[0].metric.before = null
      body.previous_steps.steps[0].metric.delta = null
      body.previous_steps.steps[0].actions_total = null
    }
    await route.fulfill({ json: body })
  })
  await page.reload()
  await expect(page.locator('.previous-page')).toContainText('Нет данных')
  await expect(page.locator('.previous-page')).toContainText('Нет сравнения')
  await expect(page.locator('.previous-warning')).toBeVisible()
  await expect(page.locator('.previous-progress').first()).toContainText('нет списка')
  unavailable = true
  await page.reload()
  await expect(page.locator('.previous-page')).toContainText('Контекст прошлого чекапа недоступен')
  await expect(page.locator('.previous-current')).toBeVisible()
})

test('late parent response cannot attach a stale return link after leaving the report', async ({ page, context }) => {
  const seeded = await setup(page)
  let release, captured
  const gate = new Promise(resolve => { release = resolve })
  const ready = new Promise(resolve => { captured = resolve })
  await page.route('**/api/checkups/*/report', async route => {
    const response = await route.fetch()
    captured()
    await gate
    await route.fulfill({ response })
  })
  await page.getByRole('button', { name: 'Открыть прошлый отчёт ↗' }).click()
  await ready
  await page.getByRole('navigation').getByRole('button', { name: 'Профиль', exact: true }).click()
  await expect(page.locator('.plan-history')).toBeVisible()
  const completed = page.waitForResponse(r => /\/api\/checkups\/[^/]+\/report$/.test(r.url()))
  release(); await completed
  await page.unroute('**/api/checkups/*/report')
  const mobile = page.locator('.h-mobile-archive')
  if (await mobile.isVisible()) await mobile.locator('summary').click()
  await page.locator('.h-record button:visible').first().click()
  await expect(page.locator('.atlas-report')).toBeVisible()
  await expect(page.getByRole('button', { name: '← К новому разбору' })).toHaveCount(0)
  if (process.env.E2E_PREVIEW === '1') {
    let releaseOffline, capturedOffline
    const offlineGate = new Promise(resolve => { releaseOffline = resolve })
    const offlineReady = new Promise(resolve => { capturedOffline = resolve })
    await page.route('**/api/checkups/*/report', async route => {
      const response = await route.fetch()
      capturedOffline()
      await offlineGate
      await route.fulfill({ response })
    })
    await page.getByRole('button', { name: 'Открыть прошлый отчёт ↗' }).click()
    await offlineReady
    await context.setOffline(true)
    await expect(page.getByText(/Офлайн · только чтение/)).toBeVisible()
    const offlineResponse = page.waitForResponse(r => /\/api\/checkups\/[^/]+\/report$/.test(r.url()))
    releaseOffline(); await offlineResponse
    await expect(reserve(page)).toContainText('1,2')
    await expect(page.getByRole('button', { name: '← К новому разбору' })).toHaveCount(0)
  }
})
