# cushion-fill-round — варианты индикатора подушки

**Контекст:** chip «Подушка» в блоке «Финансы периода» (дашборд S5, 2×2).  
**Метрика:** `fill% = safety_fund_balance / (3 × total_monthly_obligations) × 100` — норма безопасности, не цель сценария.

## Пороги цвета

| Диапазон | Tier | Цвет (light) |
|----------|------|----------------|
| &lt; 25% | `low` | `#dc2626` |
| 25–50% | `mid-low` | `#ea580c` |
| 50–75% | `mid-high` | `#ca8a04` |
| ≥ 75% | `high` | `#16a34a` |

## Варианты

| ID | Описание | Статус |
|----|----------|--------|
| **F1 ★** | Тонкая полоска (4px) под суммой в `chip__body`, track нейтральный | **Утверждено → prod** |
| F2 | Заливка фона chip снизу вверх, opacity ~22% | Сравнение — хуже на узкой ячейке |

## Prod (после утверждения)

- `frontend-react/src/utils/safetyFundFill.js` — `getSafetyFundFillPercent`, `getSafetyFundFillTier`
- Расширить `financeCards` в `DashboardPremium` + рендер в `MqxFinancePeriodBlock` / `FinanceChip`
- Стили в `index.css` (префикс `.mqx-cushion-fill*`)

## Просмотр

```powershell
cd design-lab/dashboard/cushion-fill-round
.\sync-lab.ps1
npx serve .
```

Открыть `http://localhost:3000` (или порт serve).
