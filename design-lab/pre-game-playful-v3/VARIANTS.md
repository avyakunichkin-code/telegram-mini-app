# Варианты — pre-game playful v3 (итерация 2)

## Auth (P1–P3, P6)

| Элемент | Токен |
|---------|--------|
| Заголовок Монетки | `--mq-fs-caption` (12px) |
| Текст Монетки + подсказки | `--mq-fs-small` (11px), акцент `pg-voice-em` → `--mq-warning` |
| Поля | Email (без логина) |

Подсказки — **внутри** `pg-auth-panel__subtitle`, без отдельного блока.

P3: кнопка **Продолжить** внутри `pg-continue-slot`.

## Заголовки секций (P4–P5)

`pg-pick-heading` — uppercase, `--mq-fs-caption`, цвет `--mq-warning`, отступы **18px / 10px**.

## Chip-picks (сравни в lab)

| ID | Класс | Описание |
|----|-------|----------|
| **M-A / T-A** | `mqx-pick-chip` | Полоса слева 3px (как сейчас в prod vivid) |
| **M-B / T-B** | `+ mqx-pick-chip--glass` | Стекло, полоса 4px, лёгкая тень |
| **M-C / T-C** | `+ mqx-pick-chip--soft` | Без полосы, иконка/эмодзи в halo |
| **M-D / T-D** | `+ mqx-pick-chip--outline` | Контур + цветная «точка» слева |

После ★ выбрать пару (режим + шаблоны) или один стиль на оба экрана.
