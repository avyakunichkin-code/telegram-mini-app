# PWA icons

Источник: `src/assets/brand/logo-compact.png` (G2).

Пересборка (trim прозрачности в PNG, ~2% поля, maskable отдельно):

```bash
python scripts/generate-brand-icons.py
```

Файлы: `icon-192.png`, `icon-512.png`, `icon-512-maskable.png`, `apple-touch-icon.png`, `../favicon-32.png`, `../favicon-48.png`, `../favicon-192.png`.

Подключение: `index.html` (favicon), `vite.config.js` → PWA manifest. После смены — `npm run build` и сброс кэша / переустановка PWA.

## Обновление и офлайн

- **Обновление версии** (`registerType: 'prompt'`, без `skipWaiting`): новый service worker ждёт. `src/utils/pwaUpdate.js` ставит его (`updateSW(true)` → reload) только в безопасный момент — на экране меню или когда игрок закрыл итоги хода. В партии игрок один раз видит тост «Доступна новая версия — обновится после хода». Правила — `src/utils/pwaUpdateGate.js` (+ тест).
- **Офлайн**: состояние игры на сервере. `src/utils/networkStatus.js` ставит офлайн по событию `offline` или неудачному `fetch` (`apiCall` бросает `ApiError` со `status: 0` и понятным текстом), снимает по `online` или любому ответу сервера. На экране игры — тосты «Нет сети…» / «Связь вернулась» и неактивная «Завершить ход»; после возврата связи состояние перечитывается.
- Не сделано: постоянный офлайн-баннер (нужен раунд design-lab), кэш `GET /api/finance/overview` для режима «только смотреть».
