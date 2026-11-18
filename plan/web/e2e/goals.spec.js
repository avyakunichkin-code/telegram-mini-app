import { expect, test } from '@playwright/test'

const openGoals = page => page.locator('.atlas-disclosure > summary').filter({ hasText: 'Ваши цели' }).click()

async function setup(page, achieved = false) {
  await page.goto('/')
  await page.getByLabel('E-mail').fill(`goals-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`)
  await page.getByRole('button', { name: 'Получить код' }).click()
  await page.getByLabel('6 цифр').fill((await page.locator('.stub b').innerText()).trim())
  await page.getByRole('checkbox').check()
  await page.getByRole('button', { name: 'Войти' }).click()
  await expect(page.getByRole('button', { name: /Как у нас дела в целом/ })).toBeVisible()
  const result = await page.evaluate(async achieved => {
    const call = async (method, path, body) => {
      const r = await fetch(path, { method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('plan.token')}` }, body: body && JSON.stringify(body) })
      if (!r.ok) throw Error(`Seed ${r.status}`)
      return r.json()
    }
    const old = await call('POST', '/api/checkups', { entry_question: 'goal' })
    await call('POST', `/api/checkups/${old.id}/quick`, { income: { min: 124000, max: 124000 }, must_expenses: { min: 100000, max: 100000 }, debt_payments: { min: 0, max: 0 }, savings: { min: 120000, max: 120000 }, children: 0 })
    const goals = await call('PUT', `/api/checkups/${old.id}/sections/goals`, [{ title: 'Первый взнос', target_amount: 1200000, saved_amount: 240000, target_month: '2029-11' }, { title: 'Отпуск', target_amount: 180000, saved_amount: 60000, target_month: null }])
    await call('POST', `/api/checkups/${old.id}/complete`)
    const child = await call('POST', '/api/checkups', { entry_question: 'goal' })
    if (child.data.goals[0].id !== goals[0].id) throw Error('Identity lost')
    await call('PUT', `/api/checkups/${child.id}/sections/goals`, goals.map((g, i) => ({ ...g, title: i ? g.title : 'Квартира для семьи', saved_amount: i ? 90000 : achieved ? 1200000 : 300000 })))
    const final = await call('POST', `/api/checkups/${child.id}/complete`)
    return { child: child.id, goalId: final.goals[0].id }
  }, achieved)
  await page.reload()
  await openGoals(page)
  await expect(page.locator('.goal-routes')).toBeVisible()
  return result
}

test('real repeated goals preserve identity, same-month pace unknown, no-deadline hint', async ({ page }) => {
  await setup(page)
  await expect(page.locator('.gr-main').first()).toContainText('Квартира для семьи')
  await expect(page.locator('.gr-change').first()).toContainText('+60 000')
  await expect(page.locator('.gr-side').first()).toContainText('Пока неизвестен')
  await expect(page.locator('.gr-note').first()).toContainText('не прошёл месяц')
  await page.locator('.gr-other summary').click()
  await expect(page.locator('.gr-other')).toContainText('Добавьте срок')
  await expect(page.locator('.gr-other')).not.toContainText('Нужно 0')
})

test('achievement is a reward and survives offline reload', async ({ page, context }, testInfo) => {
  const result = await setup(page, true)
  await expect(page.locator('.gr-congratulation')).toContainText('Вы это сделали!')
  await expect(page.locator('.gr-congratulation')).toContainText('нужная сумма собрана')
  for (const width of [375, 701, 1050, 1440]) {
    await page.setViewportSize({ width, height: 1000 })
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false)
    await page.locator('.goal-routes').screenshot({ path: testInfo.outputPath(`reward-${width}.png`) })
  }
  if (process.env.E2E_PREVIEW === '1') {
    await page.evaluate(async () => { await navigator.serviceWorker.ready })
    await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('plan.last-report.v1'))?.checkup.id)).toBe(result.child)
    await context.setOffline(true); await page.reload()
    await expect(page.locator('.gr-congratulation')).toContainText('Вы это сделали!')
  }
})

test('comparison display handles large values without overflow', async ({ page }) => {
  await setup(page)
  await page.route('**/api/checkups/*/report', async route => {
    const response = await route.fetch(), body = await response.json()
    Object.assign(body.goals[0], { saved_amount: 300000000000, target_amount: 1200000000000, monthly_needed: 25000000000 })
    Object.assign(body.goals[0].progress, { before: 240000000000, delta: 60000000000, months: 3, observed_monthly: 20000000000, estimated_month: '2030-08', target_changed: true, previous_target_amount: 1000000000000 })
    await route.fulfill({ json: body })
  })
  await page.reload()
  await openGoals(page)
  await expect(page.locator('.goal-routes')).toContainText('авг 2030')
  for (const width of [375, 701, 1050, 1440]) {
    await page.setViewportSize({ width, height: 1000 })
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false)
    expect(await page.locator('.gr-milestones').first().locator('b').evaluateAll(nodes => nodes.every(node => {
      const range = document.createRange(); range.selectNodeContents(node)
      return new Set([...range.getClientRects()].map(r => Math.round(r.top))).size === 1
    }))).toBe(true)
  }
})
