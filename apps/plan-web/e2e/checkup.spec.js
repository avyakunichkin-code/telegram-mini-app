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

// Real API calculations rendered by the report, rather than mocked report payloads.
for (const scenario of [
  { name: 'дефицит без подушки', income: [60000, 60000], expenses: 80000, debt: 0, savings: 0, free: -20000, first: 'stop_deficit' },
  { name: 'широкий диапазон дохода', income: [40000, 140000], expenses: 80000, debt: 0, savings: 100000, free: 10000, negative: 3 },
  { name: 'высокая долговая нагрузка', income: [100000, 100000], expenses: 50000, debt: 60000, savings: 100000, free: -10000, first: 'stop_deficit', debtRisk: true },
  { name: 'нулевые суммы', income: [0, 0], expenses: 0, debt: 0, savings: 0, free: 0 },
]) {
  test(`границы отчёта: ${scenario.name}`, async ({ page }) => {
    const errors = collectConsoleErrors(page)
    await login(page)
    await page.getByRole('button', { name: /Как у нас дела в целом/ }).click()
    await page.getByRole('button', { name: 'Дальше', exact: true }).click()
    const incomeLabel = '1. Доход семьи в месяц, на руки'
    if (scenario.income[0] !== scenario.income[1]) {
      const rangeToggle = page.getByRole('button', { name: `примерно от–до: ${incomeLabel}`, exact: true })
      await expect(rangeToggle).toBeVisible()
      await rangeToggle.click()
      await expect(page.getByRole('button', { name: `знаю точно: ${incomeLabel}`, exact: true })).toBeVisible()
      await page.getByLabel(`${incomeLabel}: от`, { exact: true }).fill(String(scenario.income[0]))
      await page.getByLabel(`${incomeLabel}: до`, { exact: true }).fill(String(scenario.income[1]))
    } else {
      await page.getByLabel(incomeLabel, { exact: true }).fill(String(scenario.income[0]))
    }
    await page.getByLabel('2. Обязательные расходы в месяц', { exact: true }).fill(String(scenario.expenses))
    await page.getByLabel('3. Платежи по всем кредитам в месяц', { exact: true }).fill(String(scenario.debt))
    await page.getByLabel('4. Сколько отложено на чёрный день', { exact: true }).fill(String(scenario.savings))
    const response = page.waitForResponse(r => /\/api\/checkups\/[^/]+\/report$/.test(r.url()) && r.request().method() === 'GET')
    await page.getByRole('button', { name: 'Показать черновой разбор', exact: true }).click()
    const result = await response
    expect(result.status()).toBe(200)
    const report = await result.json()
    expect(report.free_cashflow).toBe(scenario.free)
    await expect(page.getByText(/^Черновой разбор/)).toBeVisible()
    const freeTile = page.locator('.tile-tall').filter({ has: page.getByRole('heading', { name: 'Остаётся в месяц', exact: true }) })
    await expect(freeTile.locator('.stat-value')).toContainText(new Intl.NumberFormat('ru-RU').format(scenario.free).replace('-', '−'))
    if (scenario.first) {
      expect(report.steps[0].rule_key).toBe(scenario.first)
      await expect(page.locator('.steps .step').first()).toContainText(report.steps[0].title)
      await expect(page.locator('.area-summary').filter({ hasText: 'Бюджет' })).toHaveClass(/area-red/)
    }
    if (scenario.negative) {
      expect(report.forecast.pessimistic_months_until_negative).toBe(scenario.negative)
      expect(report.precision).not.toBe('refined')
      await expect(page.locator('.bars-warn')).toContainText('деньги кончатся')
    }
    if (scenario.debtRisk) {
      expect(report.areas.find(a => a.key === 'debts').metrics.dti_percent).toBe(60)
      await expect(page.locator('.area-summary').filter({ hasText: 'Долги' })).toHaveClass(/area-red/)
    }
    if (scenario.name === 'нулевые суммы') {
      expect(report.forecast.base.every(p => p.liquid === 0)).toBe(true)
      expect(report.steps.some(s => s.rule_key === 'direct_surplus')).toBe(false)
    }
    await expectNoHorizontalScroll(page)
    await expectMoneyUnbroken(page)
    expect(errors).toEqual([])
  })
}

test('уточнение сохраняется при переключении разделов', async ({ page }) => {
  await login(page)
  await page.getByRole('button', { name: /Как у нас дела в целом/ }).click()
  await page.getByRole('button', { name: 'Дальше', exact: true }).click()
  await page.getByRole('button', { name: 'Сразу к подробному вводу' }).click()
  await page.getByRole('button', { name: '+ Добавить', exact: true }).click()
  const inputs = page.locator('.row-card input[inputmode="numeric"]')
  await inputs.first().fill('123456')
  await page.getByRole('button', { name: 'Расходы', exact: true }).click()
  await page.getByRole('button', { name: 'Доходы', exact: true }).click()
  await expect(inputs.first()).toHaveValue('123456')
  await page.reload()
  await expect(page.locator('.row-card input[inputmode="numeric"]').first()).toHaveValue('123456')
})

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
  await first.getByRole('button', { name: 'Сделано', exact: true }).click()
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

// P3-03 / P3-07 (★ R2 + G2): повторный чекап показывает прошлые шаги и карточку цели с прогрессом.
test('повторный чекап: «С прошлого раза» и карточка цели', async ({ page }) => {
  const errors = collectConsoleErrors(page)
  await login(page)
  await page.getByRole('button', { name: /Успеем ли накопить/ }).click()
  await page.getByRole('button', { name: 'Дальше' }).click()
  await page.getByRole('button', { name: 'заполнить демо-семьёй' }).click()
  await page.getByRole('button', { name: 'Получить итоговый разбор' }).click()
  await expect(page.getByText(/^Итоговый разбор/)).toBeVisible()
  await expect(page.locator('.recheck')).toHaveCount(0)
  await page.locator('.steps .step').first().getByRole('button', { name: 'Сделано', exact: true }).click()

  await page.getByRole('button', { name: /новый чекап/ }).click()
  await page.getByRole('button', { name: /Успеем ли накопить/ }).click()
  await page.getByRole('button', { name: 'Дальше' }).click()
  await page.getByRole('button', { name: 'Сохранить и к разбору' }).click()

  await expect(page.getByText(/^Черновой разбор/)).toBeVisible()
  const recheck = page.locator('.recheck')
  await expect(recheck.getByRole('heading', { name: 'С прошлого раза' })).toBeVisible()
  await expect(recheck.locator('.was > div')).toHaveCount(3)
  await expect(recheck.locator('.st-done')).toHaveCount(1)
  await expect(page.locator('.goal').first().getByRole('heading', { name: 'Отпуск на море' })).toBeVisible()
  await expect(page.locator('.goal .bar .mark')).toHaveCount(1)
  await expectNoHorizontalScroll(page)
  await expectMoneyUnbroken(page)

  expect(errors, 'ошибки в консоли браузера').toEqual([])
})

test('утверждённые блоки отчёта: данные API, адаптивность и темы', async ({ page }, testInfo) => {
  const errors = collectConsoleErrors(page)
  await login(page)
  await page.getByRole('button', { name: /Потянем ли ипотеку/ }).click()
  await page.getByRole('button', { name: 'Дальше', exact: true }).click()
  const response = page.waitForResponse(r => /\/api\/checkups\/[^/]+\/report$/.test(r.url()) && r.request().method() === 'GET')
  await page.getByRole('button', { name: 'заполнить демо-семьёй' }).click()
  const report = await (await response).json()
  const number = value => new Intl.NumberFormat('ru-RU').format(Math.round(value)).replace('-', '−')
  await expect(page.locator('.forecast-path').first()).toContainText(number(report.forecast.base.at(-1).liquid))
  await expect(page.locator('.forecast-path').last()).toContainText(number(report.forecast.pessimistic.at(-1).liquid))
  const cushion = report.areas.find(a => a.key === 'cushion').metrics
  await expect(page.locator('.reserve-amount')).toContainText(number(cushion.cushion))
  await expect(page.locator('.reserve-foot')).toContainText(`Цель — ${cushion.target_months} мес.`)
  await expect(page.locator('.first-step-ticket')).toContainText(report.steps[0].title)
  await page.getByText('Разобраться в ответе', { exact: true }).click()
  await expect(page.locator('.answer-explanation')).toHaveAttribute('open', '')
  for (const colorScheme of ['light', 'dark']) {
    await page.emulateMedia({ colorScheme })
    for (const width of [375, 701, 792, 1050, 1440]) {
      await page.setViewportSize({ width, height: 1000 })
      await expectNoHorizontalScroll(page)
      await expectMoneyUnbroken(page)
      const contrast = await page.locator('.forecast-assumption').evaluate(el => {
        const luminance = css => {
          const channels = css.match(/[\d.]+/g).slice(0, 3).map(Number).map(v => {
            const x = v / 255; return x <= .04045 ? x / 12.92 : ((x + .055) / 1.055) ** 2.4
          })
          return channels[0] * .2126 + channels[1] * .7152 + channels[2] * .0722
        }
        const a = luminance(getComputedStyle(el).color)
        const b = luminance(getComputedStyle(el.closest('.forecast-tracks')).backgroundColor)
        return (Math.max(a, b) + .05) / (Math.min(a, b) + .05)
      })
      expect(contrast, `${width}/${colorScheme}: forecast explanation contrast`).toBeGreaterThanOrEqual(4.5)
      const clipped = await page.locator('.forecast-path strong, .reserve-amount, .ticket-steps .step > div > b').evaluateAll(nodes => nodes.filter(el => {
        const r = el.getBoundingClientRect(), card = el.closest('.card').getBoundingClientRect()
        return r.right > card.right + 1 || r.left < card.left - 1 || el.scrollWidth > el.clientWidth + 1
      }).map(el => el.textContent))
      expect(clipped, `${width}/${colorScheme}: clipped content`).toEqual([])
      await page.screenshot({ path: testInfo.outputPath(`report-${width}-${colorScheme}.png`), fullPage: true })
    }
  }
  expect(errors).toEqual([])
})

test('все разделы → повторный чекап → история → удаление аккаунта', async ({ page }) => {
  const errors = collectConsoleErrors(page)
  await login(page)
  await page.getByRole('button', { name: /Потянем ли ипотеку/ }).click()
  await page.getByRole('button', { name: 'Дальше', exact: true }).click()
  await page.getByRole('button', { name: 'заполнить демо-семьёй' }).click()
  await page.getByRole('button', { name: 'Уточнить данные', exact: true }).click()
  for (const section of ['Ваше решение', 'Доходы', 'Кредиты и долги', 'Накопления и подушка',
    'Расходы', 'Цели', 'Имущество', 'Вложения', 'Страховки', 'Пенсия']) {
    await page.getByRole('navigation', { name: 'Разделы' }).getByRole('button', { name: `${section} заполнено`, exact: true }).click()
    await expect(page.getByRole('heading', { name: section, exact: true })).toBeVisible()
    await expectNoHorizontalScroll(page)
  }
  await page.getByRole('button', { name: 'Сохранить и к разбору', exact: true }).click()
  await page.getByRole('button', { name: 'Получить итоговый разбор' }).click()
  await expect(page.getByText(/^Итоговый разбор/)).toBeVisible()
  await page.getByRole('button', { name: 'Пересчитать позже — новый чекап' }).click()
  await page.getByRole('button', { name: /Как у нас дела в целом/ }).click()
  await page.getByRole('button', { name: 'Дальше', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Доходы', exact: true })).toBeVisible()
  await expect(page.locator('.row-card')).not.toHaveCount(0)
  await page.getByRole('navigation').getByRole('button', { name: 'Профиль', exact: true }).click()
  await expect(page.locator('.history li')).toHaveCount(2)
  page.once('dialog', (dialog) => dialog.accept())
  await page.getByRole('button', { name: 'Удалить мои данные', exact: true }).click()
  await expect(page.getByLabel('E-mail')).toBeVisible()
  await page.reload()
  await expect(page.getByLabel('E-mail')).toBeVisible()
  expect(errors).toEqual([])
})

test('истёкшая сессия очищает открытый разбор', async ({ page }) => {
  await login(page)
  await page.getByRole('button', { name: /Как у нас дела в целом/ }).click()
  await page.getByRole('button', { name: 'Дальше', exact: true }).click()
  await page.getByRole('button', { name: 'заполнить демо-семьёй' }).click()
  await expect(page.getByText(/^Черновой разбор/)).toBeVisible()
  await page.route('**/api/checkups/*/report', (route) => route.fulfill({
    status: 401, contentType: 'application/json', body: JSON.stringify({ error: { code: 'unauthorized', message: 'Нужно войти' } }),
  }))
  await page.getByRole('navigation').getByRole('button', { name: 'Разбор', exact: true }).click()
  await expect(page.getByLabel('E-mail')).toBeVisible()
  await page.getByRole('button', { name: 'ТВОЙ ПЛАН Деньги отвечают' }).click()
  await expect(page.getByLabel('E-mail')).toBeVisible()
  await expect(page.getByText(/^Черновой разбор/)).toHaveCount(0)
})
