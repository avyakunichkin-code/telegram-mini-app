import { expect, test } from '@playwright/test'

test('сбой рендера показывает экран ошибки, обновление восстанавливает приложение', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel('E-mail').fill(`e2e_${Date.now().toString(36)}@example.com`)
  await page.getByRole('button', { name: 'Получить код' }).click()
  const code = (await page.locator('.stub b').innerText()).trim()
  await page.getByLabel('6 цифр').fill(code)
  await page.getByRole('checkbox').check()
  await page.getByRole('button', { name: 'Войти' }).click()
  await page.getByRole('button', { name: /Как у нас дела в целом/ }).click()
  await page.getByRole('button', { name: 'Дальше', exact: true }).click()
  await page.getByRole('button', { name: 'заполнить демо-семьёй' }).click()
  await expect(page.getByText(/^Черновой разбор/)).toBeVisible()

  const broken = '**/api/checkups/*/report'
  await page.route(broken, (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '{}' }))
  await page.getByRole('navigation').getByRole('button', { name: 'Разбор', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Что-то пошло не так' })).toBeVisible()

  await page.unroute(broken)
  await page.getByRole('button', { name: 'Обновить страницу' }).click()
  await expect(page.getByRole('heading', { name: 'Что-то пошло не так' })).toHaveCount(0)
  await page.getByRole('navigation').getByRole('button', { name: 'Разбор', exact: true }).click()
  await expect(page.getByText(/^Черновой разбор/)).toBeVisible()
})
