# PWA icons

Источник: `src/assets/brand/logo-compact.png` (G2).

Пересборка (trim прозрачности в PNG, ~2% поля, maskable отдельно):

```bash
python scripts/generate-brand-icons.py
```

Файлы: `icon-192.png`, `icon-512.png`, `icon-512-maskable.png`, `apple-touch-icon.png`, `../favicon-32.png`, `../favicon-48.png`, `../favicon-192.png`.

Подключение: `index.html` (favicon), `vite.config.js` → PWA manifest. После смены — `npm run build` и сброс кэша / переустановка PWA.
