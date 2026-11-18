import { expect, test } from '@playwright/test'

test.skip(process.env.E2E_PREVIEW !== '1', 'Service worker is tested against built production assets')
const key = 'plan.last-report.v1'

async function login(page) {
  await page.goto('/')
  await page.getByLabel('E-mail').fill(`offline-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`)
  await page.getByRole('button', { name: 'Получить код' }).click()
  await page.getByLabel('6 цифр').fill((await page.locator('.stub b').innerText()).trim())
  await page.getByRole('checkbox').check()
  await page.getByRole('button', { name: 'Войти' }).click()
  await expect(page.getByRole('button', { name: /Как у нас дела в целом/ })).toBeVisible()
}
async function finish(page) {
  await page.getByRole('button', { name: /Как у нас дела в целом/ }).click()
  await page.getByRole('button', { name: 'Дальше', exact: true }).click()
  await page.getByRole('button', { name: 'заполнить демо-семьёй' }).click()
  await page.getByRole('button', { name: 'Получить итоговый разбор' }).click()
  await expect(page.getByText(/^Итоговый разбор/)).toBeVisible()
  await expect.poll(() => page.evaluate(k => !!localStorage.getItem(k), key)).toBe(true)
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready
    if (!navigator.serviceWorker.controller) await new Promise(resolve => navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true }))
  })
}

test('built app opens latest report after offline reload; read-only; logout erases snapshot', async ({ page, context }) => {
  await login(page); await finish(page)
  const snapshot = await page.evaluate(k => JSON.parse(localStorage.getItem(k)), key)
  let offline = false, mutations = 0
  page.on('request', r => { if (offline && /\/api\//.test(r.url()) && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(r.method())) mutations++ })
  offline = true
  await context.setOffline(true)
  await page.reload()
  await expect(page.getByText(/Офлайн · только чтение/)).toBeVisible()
  await expect(page.getByText(/копия сохранена/)).toBeVisible()
  await expect(page.locator('.first-step-ticket')).toContainText(snapshot.report.steps[0].title)
  await page.locator('.first-step-ticket summary').click()
  await expect(page.locator('.first-step-ticket input').first()).toBeDisabled()
  await expect(page.getByRole('button', { name: 'Новый чекап', exact: true })).toBeDisabled()
  expect(mutations).toBe(0)
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false)
  // Static shell must contain no authenticated API/financial responses.
  expect(await page.evaluate(async () => (await Promise.all((await caches.keys()).map(async k => (await (await caches.open(k)).keys()).map(r => r.url)))).flat().filter(url => url.includes('/api/')))).toEqual([])
  await page.getByRole('navigation').getByRole('button', { name: 'Профиль', exact: true }).click()
  await page.getByRole('button', { name: 'Выйти', exact: true }).click()
  expect(await page.evaluate(k => localStorage.getItem(k), key)).toBeNull()
  await page.reload()
  await expect(page.getByLabel('E-mail')).toBeVisible()
  await expect(page.locator('.atlas-report')).toHaveCount(0)
})

test('reconnect verifies session; cancelled deletion keeps cache, successful deletion clears it', async ({ page, context }) => {
  await login(page); await finish(page)
  await context.setOffline(true)
  await page.reload()
  await expect(page.getByText(/Офлайн · только чтение/)).toBeVisible()
  await context.setOffline(false)
  await expect(page.getByText(/Офлайн · только чтение/)).toHaveCount(0)
  await page.getByRole('navigation').getByRole('button', { name: 'Профиль', exact: true }).click()
  page.once('dialog', d => d.dismiss())
  await page.getByRole('button', { name: 'Удалить мои данные' }).click()
  expect(await page.evaluate(k => !!localStorage.getItem(k), key)).toBe(true)
  page.once('dialog', d => d.accept())
  await page.getByRole('button', { name: 'Удалить мои данные' }).click()
  await expect(page.getByLabel('E-mail')).toBeVisible()
  expect(await page.evaluate(k => localStorage.getItem(k), key)).toBeNull()
})

test('an observed 401 destroys offline snapshot instead of restoring old report', async ({ page }) => {
  await login(page); await finish(page)
  await page.route('**/api/me', route => route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ error: { code: 'unauthorized', message: 'Нужно войти' } }) }))
  await page.reload()
  await expect(page.getByLabel('E-mail')).toBeVisible()
  expect(await page.evaluate(k => localStorage.getItem(k), key)).toBeNull()
})

test('no completed snapshot shows explicit empty state after offline reload', async ({ page, context }) => {
  await login(page)
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready
    if (!navigator.serviceWorker.controller) await new Promise(resolve => navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true }))
  })
  await context.setOffline(true)
  await page.reload()
  await expect(page.getByText(/Нет сети и сохранённого итогового отчёта/)).toBeVisible()
  await expect(page.locator('.atlas-report')).toHaveCount(0)
})

test('logout in another tab clears the visible report and shared cache', async ({ page, context }) => {
  await login(page); await finish(page)
  const other = await context.newPage()
  await other.goto('/')
  await expect(other.locator('.atlas-report')).toBeVisible()
  await page.getByRole('navigation').getByRole('button', { name: 'Профиль', exact: true }).click()
  await page.getByRole('button', { name: 'Выйти', exact: true }).click()
  await expect(other.getByLabel('E-mail')).toBeVisible()
  await expect(other.locator('.atlas-report')).toHaveCount(0)
  expect(await other.evaluate(k => localStorage.getItem(k), key)).toBeNull()
})

test('a report response arriving after logout cannot restore the report or cache', async ({ page, context }) => {
  await login(page); await finish(page)
  const other = await context.newPage()
  await other.goto('/')
  await expect(other.locator('.atlas-report')).toBeVisible()
  let release, captured
  const gate = new Promise(resolve => { release = resolve })
  const ready = new Promise(resolve => { captured = resolve })
  await page.route('**/api/checkups/*/report', async route => {
    const response = await route.fetch()
    captured()
    await gate
    await route.fulfill({ response })
  })
  await page.getByRole('navigation').getByRole('button', { name: 'Профиль', exact: true }).click()
  await page.getByRole('button', { name: 'Открыть первый отчёт' }).click()
  await ready
  await other.getByRole('navigation').getByRole('button', { name: 'Профиль', exact: true }).click()
  await other.getByRole('button', { name: 'Выйти', exact: true }).click()
  await expect(page.getByLabel('E-mail')).toBeVisible()
  const completed = page.waitForResponse(r => /\/api\/checkups\/[^/]+\/report$/.test(r.url()))
  release()
  await completed
  await expect(page.getByLabel('E-mail')).toBeVisible()
  await expect(page.locator('.atlas-report')).toHaveCount(0)
  expect(await page.evaluate(k => localStorage.getItem(k), key)).toBeNull()
})
