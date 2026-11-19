import {
  dismissRitual,
  expect,
  gameMain,
  guidanceStrip,
  playTurnOne,
  readCash,
  startNewGameFromMenu,
  test,
} from './fixtures.js';

test.describe('Регистрация и первый ход', () => {
  test('гостевой экран заполняет окно и совпадает с Design Lab', async ({ page }) => {
    for (const width of [320, 390, 528]) {
      await page.setViewportSize({ width, height: 800 });
      const capture = async (url, label) => {
        await page.goto(url);
        const screen = page.getByRole('region', { name: 'Старт игры' });
        await expect(screen.getByRole('button', { name: 'Играть без аккаунта' })).toBeVisible();
        const bounds = await screen.boundingBox();
        expect(bounds.width).toBe(width);
        expect(bounds.height).toBeGreaterThanOrEqual(800);
        await screen.evaluate(async (node) => {
          await document.fonts.ready;
          await Promise.all([...node.querySelectorAll('img')].map((image) => image.decode()));
        });
        return screen.screenshot({
          animations: 'disabled',
          scale: 'css',
          path: test.info().outputPath(`${label}-${width}.png`),
        });
      };
      const lab = await capture('/#/dev/mqx/start', 'lab');
      const game = await capture('/#/', 'game');
      const difference = await page.evaluate(async (screenshots) => {
        const images = await Promise.all(screenshots.map(async (data) => {
          const image = new Image();
          image.src = `data:image/png;base64,${data}`;
          await image.decode();
          return image;
        }));
        const [labImage, gameImage] = images;
        const { width, height } = labImage;
        if (gameImage.width !== width || gameImage.height !== height) return 1;
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext('2d', { willReadFrequently: true });
        const [expected, actual] = images.map((image) => {
          context.clearRect(0, 0, width, height);
          context.drawImage(image, 0, 0);
          return context.getImageData(0, 0, width, height).data;
        });
        let changedPixels = 0;
        for (let i = 0; i < expected.length; i += 4) {
          if ([0, 1, 2].some((channel) => Math.abs(expected[i + channel] - actual[i + channel]) > 24)) {
            changedPixels++;
          }
        }
        return changedPixels / (width * height);
      }, [lab.toString('base64'), game.toString('base64')]);
      // Chrome can antialias thin edges differently when the Lab footer adds scroll.
      expect(difference, `игра и Lab при ширине ${width}px`).toBeLessThan(0.02);
    }
  });

  test('гостевой старт сохраняет партию при восстановлении сессии', async ({ page }) => {
    await page.goto('/#/');
    const firstStart = page.waitForResponse((response) => response.url().endsWith('/api/game/guest-start'));
    await page.getByRole('button', { name: 'Играть без аккаунта' }).click();
    const response = await firstStart;
    expect(response.ok()).toBeTruthy();
    const first = await response.json();
    await expect(page.getByRole('heading', { name: 'Твой напарник' })).toBeVisible();
    const monetka = page.locator('.start-lab__intro img');
    await expect(monetka).toHaveAttribute('src', /\/monetka\/welcome\.webp$/);
    await monetka.evaluate((image) => image.decode());

    await page.evaluate(() => {
      localStorage.removeItem('tg_miniapp_token');
      sessionStorage.clear();
    });
    await page.reload();
    const profiles = page.waitForResponse((result) => result.url().endsWith('/api/game/profiles') && result.ok());
    await page.getByRole('button', { name: 'Играть без аккаунта' }).click();
    expect((await (await profiles).json()).map((profile) => profile.id)).toEqual([first.profile_id]);
    await expect(page.getByRole('heading', { name: 'Продолжить партию' })).toBeVisible();
    await page.getByRole('button', { name: 'Продолжить игру' }).click();
    await expect(page.getByRole('button', { name: 'Завершить ход и перейти к следующему' })).toBeVisible();
  });

  test('регистрация через форму ведёт в меню без сохранений', async ({ page }) => {
    const id = `${Date.now().toString(36)}${Math.random().toString(16).slice(2, 6)}`;
    const password = `E2e-${id}-pass`;
    await page.goto('/#/login');
    await page.getByRole('button', { name: /Создать аккаунт/ }).click();
    await page.getByLabel('Почта').fill(`e2e_form_${id}@example.com`);
    await page.getByLabel(/^Пароль/).fill(password);
    await page.getByLabel('Повтори пароль').fill(password);
    await page.getByRole('button', { name: 'Создать аккаунт' }).click();
    await expect(page.getByRole('heading', { name: 'Сохранений пока нет' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Новая игра' })).toBeVisible();
  });

  test('ход 1 по онбордингу: зарплата, подушка, итоги без стартового капитала', async ({ page, player }) => {
    await startNewGameFromMenu(page);
    const startCash = await playTurnOne(page);
    expect(startCash).toBeGreaterThan(0);

    const ritual = page.locator('.mqx-juice-ritual');
    await expect(ritual).toContainText('Ход №1 завершён');
    // Регресс 2026-10-26: стартовый баланс считался доходом хода («+21 000 ₽ за ход» при реальных +6 000).
    const ritualText = await ritual.innerText();
    const balance = Number(ritualText.match(/На счёте\s*([\d\s\u00a0\u202f]+)₽/)[1].replace(/[^\d]/g, ''));
    const delta = Number(ritualText.match(/Итого за ход\s*([+−-][\d\s\u00a0\u202f]+)₽/)[1].replace(/[^\d]/g, ''));
    expect(delta).toBe(balance - startCash);

    await dismissRitual(page);
    await expect(gameMain(page)).toContainText('Ход 2');
    expect(await readCash(page)).toBe(balance);
    await expect(guidanceStrip(page)).toContainText('Новый ход');
  });

  test('перезагрузка во время партии возвращает в игру, а не в меню', async ({ page, player }) => {
    await startNewGameFromMenu(page);
    // Регресс 2026-10-26: после F5 / обновления PWA игрок оказывался в «Меню».
    await page.reload();
    await expect(page.getByRole('button', { name: 'Завершить ход и перейти к следующему' })).toBeVisible();
    // Регресс 2026-10-26: вложенные <main> — ориентир должен быть один.
    await expect(page.getByRole('main')).toHaveCount(1);
  });
});
