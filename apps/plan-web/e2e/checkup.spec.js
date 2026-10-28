import { expect, test } from '@playwright/test'

/** Ошибки консоли и исключения страницы — тест падает в конце, если они были. */
function collectConsoleErrors(page) {
  const errors = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(`${msg.text()} @ ${msg.location().url}`)
  })
  page.on('pageerror', (err) => errors.push(String(err)))
  return errors
}

/** Ширина документа не больше окна: на телефоне нет горизонтальной прокрутки. */
async function expectNoHorizontalScroll(page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  expect(overflow, 'горизонтальная прокрутка').toBeLessThanOrEqual(0)
}

/** Суммы «1 234 567 ₽» не рвутся по строкам — ни между разрядами, ни перед ₽. */
async function expectMoneyUnbroken(page) {
  const broken = await page.evaluate(() => {
    const re = /[−+-]?\d{1,3}(?:[\s  ]\d{3})+[\s  ]?₽?/g
    const walker = document.createTreeWalker(document.querySelector('main'), NodeFilter.SHOW_TEXT)
    const out = []
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      for (const m of n.data.matchAll(re)) {
        const r = document.createRange()
        r.setStart(n, m.index)
        r.setEnd(n, m.index + m[0].length)
        if (new Set([...r.getClientRects()].map((x) => Math.round(x.top))).size > 1) out.push(m[0])
      }
    }
    return out
  })
  expect(broken, 'суммы, разорванные переносом строки').toEqual([])
}

async function login(page) {
  const email = `e2e_${Date.now().toString(36)}${Math.random().toString(16).slice(2, 6)}@example.com`
  await page.goto('/')
  await page.getByLabel('E-mail').fill(email)
  await page.getByRole('button', { name: 'Получить код' }).click()
  // Прототип: код не уходит на почту, а показывается на экране (dev_code).
  const code = (await page.locator('.stub b').innerText()).trim()
  await page.getByLabel('6 цифр').fill(code)
  await page.getByRole('checkbox').check()
  await page.getByRole('button', { name: 'Войти' }).click()
}

// CS-11: вход → черновой → итоговый отчёт → шаг сделан.
test('чекап: вход → черновой разбор → итоговый → шаг сделан', async ({ page }) => {
  const errors = collectConsoleErrors(page)
  await login(page)

  await page.getByRole('button', { name: /Как у нас дела в целом/ }).click()
  await expect(page.getByRole('heading', { name: 'Кто в семье' })).toBeVisible()
  await page.getByRole('button', { name: 'Дальше' }).click()

  await expect(page.getByRole('heading', { name: 'Примерно — уже достаточно' })).toBeVisible()
  await page.getByRole('button', { name: '150 тыс–250 тыс' }).click()
  await page.getByRole('button', { name: '60 тыс–100 тыс' }).click()
  await expectNoHorizontalScroll(page)
  await page.getByRole('button', { name: 'Показать черновой разбор' }).click()

  await expect(page.getByText(/^Черновой разбор/)).toBeVisible()
  // «Три первых сработавших» правила — на скудных данных их может быть меньше трёх.
  await expect(page.locator('.steps .step').first()).toBeVisible()
  expect(await page.locator('.steps .step').count()).toBeLessThanOrEqual(3)
  await expect(page.locator('.scenario')).toHaveCount(4)
  await expectNoHorizontalScroll(page)

  // Черновик переживает перезагрузку: возвращаемся к нему, а не к выбору вопроса.
  await page.reload()
  await page.getByRole('navigation').getByRole('button', { name: 'Разбор', exact: true }).click()
  await expect(page.getByText(/^Черновой разбор/)).toBeVisible()

  await page.getByRole('button', { name: 'Получить итоговый разбор' }).click()
  await expect(page.getByText(/^Итоговый разбор/)).toBeVisible()
  await expectNoHorizontalScroll(page)
  await expectMoneyUnbroken(page)

  const first = page.locator('.steps .step').first()
  await first.getByRole('button', { name: '✓ Сделано' }).click()
  await expect(first.locator('.done-note')).toHaveText('Сделано')
  await expect(first).toHaveClass(/step-done/)

  expect(errors, 'ошибки в консоли браузера').toEqual([])
})

// Полный отчёт на демо-семье (ипотека, карта, автокредит): таблицы долгов и цели — самые длинные суммы.
test('демо-семья: полный разбор без переносов в суммах и ошибок консоли', async ({ page }) => {
  const errors = collectConsoleErrors(page)
  await login(page)
  await page.getByRole('button', { name: /Потянем ли ипотеку/ }).click()
  await page.getByRole('button', { name: 'Дальше' }).click()
  await page.getByRole('button', { name: 'заполнить демо-семьёй' }).click()

  await expect(page.getByText(/^Черновой разбор/)).toBeVisible()
  await expect(page.getByText('Кредиты: как закрыть быстрее')).toBeVisible()
  await expectNoHorizontalScroll(page)
  await expectMoneyUnbroken(page)

  expect(errors, 'ошибки в консоли браузера').toEqual([])
})
