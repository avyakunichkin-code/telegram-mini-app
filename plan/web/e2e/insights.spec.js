import { test, expect } from '@playwright/test'

async function seed(page, sections) {
  await page.goto('/')
  await page.getByLabel('E-mail').fill(`insights-${Date.now()}-${Math.random().toString(16).slice(2)}@example.com`)
  await page.getByRole('button', { name: 'Получить код' }).click()
  await page.getByLabel('6 цифр').fill((await page.locator('.stub b').innerText()).trim())
  await page.getByRole('checkbox').check()
  await page.getByRole('button', { name: 'Войти', exact: true }).click()
  await page.getByRole('button', { name: /Как у нас дела в целом/ }).waitFor()
  await page.evaluate(async sections => {
    const call = async (method, path, body) => {
      const response = await fetch(path, { method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('plan.token')}` }, body: body && JSON.stringify(body) })
      if (!response.ok) throw Error('Seed failed ' + response.status)
      return response.json()
    }
    const members = await call('PUT', '/api/household/members', [{ label: 'Я', role: 'adult' }])
    const ck = await call('POST', '/api/checkups', { entry_question: 'overview' })
    for (const [name, rows] of Object.entries(sections)) await call('PUT', `/api/checkups/${ck.id}/sections/${name}`, rows.map(row => ('amount' in row && name === 'incomes' ? { ...row, member_id: members[0].id } : row)))
    await call('POST', `/api/checkups/${ck.id}/complete`)
  }, sections)
  await page.reload()
  await page.locator('.insights').waitFor()
}

const money = v => ({ min: v, max: v })

test('A: итоговый отчёт показывает план остатка, запас, долги и проверку данных', async ({ page }, info) => {
  const errors = []
  page.on('pageerror', e => errors.push(e.message))
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()) })
  await seed(page, {
    incomes: [{ amount: money(100000) }],
    expenses: [{ category_key: 'life', title: 'Жизнь', amount: money(60000) }],
    savings: [{ kind: 'account', amount: money(300000) }],
    liabilities: [{ kind: 'card', title: 'Карта', balance: 100000, annual_rate: 36, monthly_payment: 1000 }],
  })
  const block = page.locator('.insights')
  await expect(block.getByRole('region', { name: 'Проверка данных' })).toContainText('ни одна строка не отмечена как подушка')
  await expect(block.getByRole('region', { name: 'План остатка' })).toContainText('Куда направить')
  await expect(block.getByRole('region', { name: 'Запас хода' })).toContainText('Только обязательное')
  await expect(block.getByRole('region', { name: 'Цена долгов' })).toContainText('не гасится')
  await expect(block.getByRole('region', { name: 'Пределы решения' })).toHaveCount(0)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.screenshot({ path: info.outputPath('insights.png'), fullPage: true })
  expect(errors).toEqual([])
})
