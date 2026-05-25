# Подушка — индикатор наполнения (design-lab)

Раунд для chip «Подушка» на дашборде: визуализация % от цели **×3 обязательств**.

## Быстрый старт

```powershell
cd design-lab/dashboard/cushion-fill-round
.\sync-lab.ps1
npx serve .
```

Только `./lab-base.css` и `./styles.css` — без `../` (иначе 404 при `serve`).

## Файлы

| Файл | Назначение |
|------|------------|
| `index.html` | Демо F1/F2, слайдер, контекст 2×2 |
| `styles.css` | Стили раунда |
| `lab-base.css` | AUTO (`sync-lab.ps1`) |
| `lab.js` | Тема + слайдер |
| `VARIANTS.md` | Пороги и решение F1 ★ |

## Данные (prod)

- Текущая сумма: `overview.safety_fund_balance`
- Норма: `overview.safety_fund_baseline_target` или 3 × `total_monthly_obligations` (не `win_target_safety_fund`)
