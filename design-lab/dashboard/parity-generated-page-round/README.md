# Dashboard — prod parity (generated)

Эта папка генерируется скриптом и используется как “страница целиком” без склейки CSS.

Запуск:

```bash
cd design-lab/dashboard/parity-generated-page-round
npx serve .
```

В папке есть `serve.json` (`cleanUrls: false`, `directoryListing: false`). Iframe грузят `blocks/*/index.html`.

Пересборка:

```bash
cd frontend-react
npm run design-lab:build-dashboard-page-round
```

Можно пересобирать при запущенном `npx serve .` (скрипт обновляет файлы in-place).
Если Windows выдаёт EPERM — остановите serve в этой папке и повторите.

Источник правды:

- `design-lab/dashboard/canon.manifest.json`
