import { test, expect } from '@playwright/test'

test('button: ref, keyboard, form type and busy lock', async ({ page }) => {
  const errors = []
  page.on('pageerror', e => errors.push(e.message))
  await page.goto('/e2e/button.html')
  const action = page.getByRole('button', { name: 'Действие', exact: true })
  await page.getByRole('button', { name: 'Фокус', exact: true }).click()
  await expect(action).toBeFocused()
  await page.keyboard.press('Enter')
  await page.keyboard.press('Space')
  await expect(page.getByLabel('Нажатия')).toHaveText('2')
  await expect(page.getByLabel('Отправки')).toHaveText('0')
  await page.getByRole('button', { name: 'Отправить', exact: true }).click()
  await expect(page.getByLabel('Отправки')).toHaveText('1')
  await page.getByRole('button', { name: 'Загрузка', exact: true }).click()
  const waiting = page.getByRole('button', { name: 'Секунду…' })
  await expect(waiting).toBeDisabled()
  await expect(waiting).toHaveAttribute('aria-busy', 'true')
  await page.getByRole('button', { name: 'Загрузка', exact: true }).click()
  await expect(action).toBeEnabled()
  expect(errors).toEqual([])
})
