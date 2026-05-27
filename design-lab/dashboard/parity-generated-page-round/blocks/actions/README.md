# Dashboard — period actions round ★ FINAL

Утверждённый макет P1: chip 2×2, Монетка **wink** справа, amber-акценты в пузыре.

## Запуск

```powershell
cd design-lab/dashboard/period-actions-round
```

**Sync CSS** (если `.\sync-lab.ps1` падает с ExecutionPolicy):

```cmd
sync-lab.cmd
```

или:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\sync-lab.ps1
```

```powershell
npx serve .
```

Открыть `http://localhost:3000` (порт serve) → `index.html`.

## Sync

После правок `styles.css` или `../styles.css`:

```powershell
.\sync-lab.ps1
```

Коммитить: `lab-base.css`, `assets/*`, `index.html`, `styles.css`, `sync-lab.ps1`.

## Файлы

| Файл | Назначение |
|------|------------|
| `VARIANTS.md` | Сравнение R0, P1–P4 |
| `CONTENT.md` | Тексты chip и Монетки |
| `lab.js` | Тема, toggle disabled зарплаты, hub подушки |

## Assets

- `monetka-think.png` — подсказка P1/P3
- `monetka-wink.png` — P2/P4 (если нет — fallback на think)
- `monetka-mascot.png` — запас

## Следующий шаг

Утвердить вариант (P1 / P2 / гибрид) → `DESIGN_WORKFLOW` → `mqx/` → `DashboardPremium`.
