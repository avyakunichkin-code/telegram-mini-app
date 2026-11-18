import { expect, test } from '@playwright/test'

async function seed(page) {
  await page.goto('/')
  await page.getByLabel('E-mail').fill(`precision-${Date.now()}-${Math.random().toString(16).slice(2)}@example.com`)
  await page.getByRole('button', { name: 'Получить код' }).click()
  await page.getByLabel('6 цифр').fill((await page.locator('.stub b').innerText()).trim())
  await page.getByRole('checkbox').check()
  await page.getByRole('button', { name: 'Войти', exact: true }).click()
  await page.getByRole('button', { name: /Как у нас дела в целом/ }).waitFor()
  const id = await page.evaluate(async () => {
    const call = async (method, path, body) => {
      const response = await fetch(path, { method, headers: { 'Content-Type':'application/json', Authorization:`Bearer ${localStorage.getItem('plan.token')}` }, body: body && JSON.stringify(body) })
      if (!response.ok) throw Error(`Synthetic seed: ${response.status} ${path}`)
      return response.json()
    }
    const members = await call('PUT','/api/household/members',[{label:'Я',role:'adult'}])
    const ck = await call('POST','/api/checkups',{entry_question:'overview'})
    const data = {
      incomes:[{member_id:members[0].id,kind:'salary',amount:{min:120000,max:120000}},{member_id:members[0].id,kind:'other',amount:{min:10000,max:50000}}],
      expenses:[{category_key:'life',title:'Жизнь',tier:'must',amount:{min:20000,max:100000}}],
      savings:[{kind:'account',amount:{min:270000,max:270000},is_safety_fund:true}],
      liabilities:[{id:'synthetic-loan',kind:'consumer',title:'Оценённый кредит',balance:100000,annual_rate:18,monthly_payment:30000,estimated:true}],
    }
    for (const [section,rows] of Object.entries(data)) await call('PUT',`/api/checkups/${ck.id}/sections/${section}`,rows)
    return ck.id
  })
  await page.reload()
  await page.locator('.precision-refine').waitFor()
  return id
}

async function stored(page,id) {
  return page.evaluate(async id => (await fetch(`/api/checkups/${id}`, {headers:{Authorization:`Bearer ${localStorage.getItem('plan.token')}`}})).json(),id)
}

test('P3-11: warning is soft, invalid bounds block, failed save/offline preserve input', async ({page,context}, info) => {
  const errors=[];page.on('pageerror',e=>errors.push(e.message))
  const id=await seed(page)
  await page.locator('.precision-section-hint button').click()
  await expect(page.getByRole('heading',{name:'Расходы',exact:true})).toBeVisible()
  const min=page.getByLabel('В месяц: от',{exact:true}),max=page.getByLabel('В месяц: до',{exact:true})
  await expect(page.getByText('Широкий диапазон. Сохранить можно.')).toBeVisible()
  await expect(page.getByRole('button',{name:/^Дальше:/})).toBeEnabled()
  await min.fill('110000')
  await expect(page.getByRole('button',{name:/^Дальше:/})).toBeDisabled()
  await min.fill('20000');await max.fill('99000')
  let fail=true
  await page.route('**/api/checkups/*/sections/expenses',async route=>{
    if(fail){fail=false;await route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({error:{code:'unavailable',message:'Сохранение временно недоступно'}})})}
    else await route.continue()
  })
  await page.getByRole('button',{name:/^Дальше:/}).click()
  await expect(page.getByRole('alert').filter({hasText:'Сохранение временно недоступно'})).toBeVisible()
  await expect(max).toHaveValue('99 000'.replaceAll(' ',''))
  await context.setOffline(true)
  await expect(page.getByText(/Офлайн · ввод сохранится/)).toBeVisible()
  await expect(max).toHaveValue('99000');await expect(max).toBeDisabled()
  await context.setOffline(false)
  await expect(max).toBeEnabled();await expect(max).toHaveValue('99000')
  await page.getByRole('button',{name:/^Дальше:/}).click()
  await expect(page.getByRole('heading',{name:'Кредиты и долги',exact:true})).toBeVisible()
  expect(Number((await stored(page,id)).data.expenses[0].amount.max)).toBe(99000)
  for(const section of ['Накопления и подушка','Цели','Имущество','Вложения','Страховки','Пенсия']){
    await page.locator('.precision-refine .tab').filter({hasText:section}).click()
    await expect(page.locator('.precision-pill')).toBeVisible()
  }
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)
  await page.screenshot({path:info.outputPath('precision-wizard.png'),fullPage:true})
  expect(errors).toEqual([])
})

test('P3-11: deleting a row preserves the next range; inferred loan needs both contract fields', async ({page}, info) => {
  const id=await seed(page)
  const cards=page.locator('.row-card')
  await cards.first().getByRole('button',{name:'Точно: Сумма в месяц',exact:true}).click()
  await cards.first().getByRole('button',{name:'Убрать',exact:true}).click()
  await expect(page.getByLabel('Сумма в месяц: до',{exact:true})).toHaveValue('50000')
  await page.getByLabel('Сумма в месяц: от',{exact:true}).fill('12000')
  await expect(page.getByLabel('Сумма в месяц: до',{exact:true})).toHaveValue('50000')
  await page.locator('.precision-refine .tab').filter({hasText:'Кредиты и долги'}).click()
  await page.getByRole('heading',{name:'Кредиты и долги',exact:true}).waitFor()
  await page.getByLabel('Название',{exact:true}).fill('Уточнить позже')
  await page.getByLabel('Платёж в месяц, ₽',{exact:true}).fill('31000')
  await expect(page.getByText('Оценка из быстрого старта.',{exact:false})).toBeVisible()
  await page.getByRole('button',{name:/^Дальше:/}).click()
  await page.getByRole('heading',{name:'Накопления и подушка',exact:true}).waitFor()
  expect((await stored(page,id)).data.liabilities[0].estimated).toBe(true)
  await page.locator('.precision-refine .tab').filter({hasText:'Кредиты и долги'}).click()
  await page.getByLabel('Остаток долга, ₽',{exact:true}).fill('90000')
  await expect(page.getByText('Оценка из быстрого старта.',{exact:false})).toBeVisible()
  await page.getByLabel('Ставка, % годовых',{exact:true}).fill('12')
  await expect(page.getByText('Оценка из быстрого старта.',{exact:false})).toHaveCount(0)
  await page.getByRole('button',{name:/^Дальше:/}).click()
  await page.getByRole('heading',{name:'Накопления и подушка',exact:true}).waitFor()
  expect((await stored(page,id)).data.liabilities[0].estimated).toBe(false)
  await page.screenshot({path:info.outputPath('precision-after-save.png'),fullPage:true})
})
