# orient-round — сводка + доходы/расходы

Ориентация на странице «Управление капиталом» без бюджета и без цели сценария.

## Запуск

```powershell
cd design-lab/capital-page/orient-round
.\sync-lab.sh
npx serve .
```

Открыть `http://localhost:3000` (порт serve).

## Sync

После правок `styles.css` или родительских стилей:

```powershell
.\sync-lab.sh
```

## Файлы

| Файл | Назначение |
|------|------------|
| `index.html` | O1–O4 на 420px |
| `styles.css` | `.cap-health`, `.cap-flow-bridge`, merged |
| `lab-base.css` | auto (parent + flows-round + round) |
| `VARIANTS.md` | таблица решений |

## Связанные

- [`../flows-round/`](../flows-round/) — аккордеоны доходов/расходов (prod)
- [`../README.md`](../README.md) — IA страницы капитала
