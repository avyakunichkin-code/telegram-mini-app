# UI states + icons — утверждено

**Дата:** 2026-05-29  
**Раунд:** [`states-icons-round/`](./states-icons-round/)

| Секция | ID | Решение |
|--------|-----|---------|
| S1 Empty | **C′** | Inline: **иконка** (accent-круг) + **CTA**, без серого фона, без billboard; текст — `visually-hidden` / `aria-label` |
| S2 Error | **B** | Inline: warning + заголовок + подпись + «Повторить» |
| S3 Loading | **B** / **C** | Строки (финансы, списки) — skeleton rows; сетка 2×2 (дашборд) — skeleton chips |
| S4 Ritual | **A** | SVG `FinanceMetricIcons` в beats (не `+` / `!` / `◎`) |
| S5 Chips | **D0** | **Без изменений** — inline SVG в `DashboardPremium` остаётся каноном |

## Prod

| Компонент | Файл |
|-----------|------|
| Empty inline | `MqxCapitalEmpty` |
| Error | `MqxStateError` |
| Loading | `MqxStateSkeleton` (`rows` \| `chips`) |
| Ritual icons | `periodCloseRitual.js`, `MqxPeriodCloseRitual` |

## Запрещено

- Возвращать `mqx-fin-empty` (dashed) в новом коде
- Менять иконки chips 2×2 без нового lab (D0 ★)
