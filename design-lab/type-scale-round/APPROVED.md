# Type scale round — ★ FINAL

**Дата:** 2026-05-25  
**Выбор:** Display **A = 26px** (`--mq-fs-display`)

## Решения

| Было | Стало | Токен |
|------|-------|-------|
| 13px (суммы chip, pill) | 12px | `--mq-fs-caption` |
| 9px (kicker chip, period label) | 10px | `--mq-fs-micro` |
| Hero timer 20px → | **26px** | `--mq-fs-display` |

## Целевая шкала (prod `#root`)

| Токен | px |
|-------|-----|
| `--mq-fs-display` | **26** |
| `--mq-fs-title` | 20 |
| `--mq-fs-heading` | 14 |
| `--mq-fs-body` | 15 |
| `--mq-fs-caption` | 12 |
| `--mq-fs-small` | 11 |
| `--mq-fs-micro` | 10 |

Веса: `--mq-fw-regular` 400, `--mq-fw-medium` 550, `--mq-fw-bold` 700, `--mq-fw-heavy` 800.

## Prod

- **W2 dashboard** — hero compact, finance chips, period actions, goal dash, pills.
- **W3+ глобально** — остальные `.mqx-*` в `index.css` (capital, analytics, events, onboarding, catalog…); KPI `--mq-fs-stat` 34px.
- Исключения: `16px` только `:root` media и `.mq-page--auth .mq-field__input` (iOS zoom); legacy `h1` 56/36 вне MQX.

## Документация

- `docs/reference/brandbook/BRANDBOOK_MQX.md` §5  
- `docs/specs/SPEC_FRONTEND_UI.md` — токены Design System

## Lab

`design-lab/type-scale-round/` — default display A в `styles.css` (`--mq-fs-display: var(--mq-fs-display-a)`).
