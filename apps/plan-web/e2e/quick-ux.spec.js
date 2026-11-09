import { expect, test } from '@playwright/test'

async function toQuick(page) {
  const email = `ux_${Date.now().toString(36)}${Math.random().toString(16).slice(2, 6)}@example.com`
  await page.goto('/')
  await page.getByLabel('E-mail').fill(email)
  await page.getByRole('button', { name: 'Получить код' }).click()
  const code = (await page.locator('.stub b').innerText()).trim()
  await page.getByLabel('6 цифр').fill(code)
  await page.getByRole('checkbox').check()
  await page.getByRole('button', { name: 'Войти' }).click()
  await page.getByRole('button', { name: /Как у нас дела в целом/ }).click()
  await page.getByRole('button', { name: 'Дальше', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Примерно — уже достаточно' })).toBeVisible()
}

const income = '1. Доход семьи в месяц, на руки'
const expenses = '2. Обязательные расходы в месяц'

test('быстрый старт: пустая анкета не отправляется, суммы с разрядами, пресет выделен', async ({ page }) => {
  await toQuick(page)
  await page.getByRole('button', { name: 'Показать черновой разбор' }).click()
  await expect(page.getByRole('alert')).toContainText('Укажите доход семьи')

  await page.getByLabel(income, { exact: true }).fill('1500000')
  await expect(page.getByLabel(income, { exact: true })).toHaveValue('1 500 000')

  const preset = page.getByRole('button', { name: '60 тыс–100 тыс' })
  await preset.click()
  await expect(preset).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByLabel(`${expenses}: до`, { exact: true })).toHaveValue('100 000')
})

test('логотип на черновике не уводит к созданию новой анкеты', async ({ page }) => {
  await toQuick(page)
  await page.locator('.brand').click()
  await expect(page.getByRole('heading', { name: 'Примерно — уже достаточно' })).toBeVisible()
})

test('переход к следующему разделу открывает его с начала', async ({ page }) => {
  await toQuick(page)
  await page.getByRole('button', { name: 'Сразу к подробному вводу' }).click()
  await page.evaluate(() => { document.body.style.minHeight = '3000px'; window.scrollTo(0, 1500) })
  await page.getByRole('button', { name: /^Дальше:/ }).click()
  await expect(page.getByRole('heading', { level: 1 })).toBeFocused()
  expect(await page.evaluate(() => window.scrollY)).toBe(0)
  await expect(page.getByRole('button', { name: 'Данные' })).toHaveAttribute('aria-current', 'page')
})
