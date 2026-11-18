import { expect, test } from '@playwright/test'

test('действия: ошибка, повтор, перезагрузка, завершение и возврат', async ({ page, context }) => {
  await page.goto('/')
  await page.getByLabel('E-mail').fill(`actions-${Date.now()}@example.com`)
  await page.getByRole('button', { name: 'Получить код' }).click()
  const code = (await page.locator('.stub b').innerText()).trim()
  await page.getByLabel('6 цифр').fill(code)
  await page.getByRole('checkbox').check()
  await page.getByRole('button', { name: 'Войти' }).click()
  await expect(page.getByRole('button', { name: /Как у нас дела в целом/ })).toBeVisible()
  await page.evaluate(async () => {
    const call = async (path, body) => {
      const response = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('plan.token')}` }, body: body && JSON.stringify(body) })
      if (!response.ok) throw Error(`Seed failed: ${response.status}`)
      return response.json()
    }
    const ck = await call('/api/checkups', { entry_question: 'overview' })
    await call(`/api/checkups/${ck.id}/quick`, { income: { min: 150000, max: 180000 }, must_expenses: { min: 90000, max: 110000 }, debt_payments: { min: 20000, max: 20000 }, savings: { min: 100000, max: 150000 }, children: 1 })
    await call(`/api/checkups/${ck.id}/complete`)
  })
  await page.reload()
  const step = page.locator('.first-step-ticket')
  await step.locator('summary').click()
  const checks = step.locator('.plan-step-list input')
  const total = await checks.count()
  expect(total).toBeGreaterThan(0)
  let fail = true
  await page.route('**/api/steps/*/actions/*', async route => {
    if (fail) { fail = false; await route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: { code: 'unavailable', message: 'Попробуйте снова' } }) }) }
    else await route.continue()
  })
  await checks.first().click()
  await expect(step.getByText('Не удалось сохранить. Прогресс не изменён.')).toBeVisible()
  await expect(checks.first()).not.toBeChecked()
  await step.getByRole('button', { name: 'Повторить сохранение' }).click()
  await expect(checks.first()).toBeChecked()
  await page.reload()
  await step.locator('summary').click()
  await expect(checks.first()).toBeChecked()
  await context.setOffline(true)
  await expect(checks.first()).toBeDisabled()
  await expect(step.getByText('Нет сети. Отметки доступны после подключения.')).toBeVisible()
  await context.setOffline(false)
  for (let i = 1; i < total; i++) {
    await checks.nth(i).click()
    await expect(step).not.toHaveAttribute('aria-busy', 'true')
    await expect(step.locator('.plan-step-actions')).toHaveAttribute('aria-busy', 'false')
    await expect(checks.nth(i)).toBeChecked()
  }
  await expect(step.getByText('Все действия выполнены. Шаг завершён.')).toBeVisible()
  await step.getByRole('button', { name: 'Вернуть в работу' }).click()
  await expect(checks.last()).not.toBeChecked()
  await step.getByRole('button', { name: 'Завершить шаг вручную' }).click()
  await expect(step.getByText('Шаг завершён вручную.', { exact: false })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false)
})
