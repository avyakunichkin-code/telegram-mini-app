# Раунд 2 — визуал доменов (`event_domain`)

**Предпосылка:** утверждён каркас из [`../layout-round/`](../layout-round/) (сейчас превью на **L3** — замените на ★ layout).

## Домены MVP (backend)

Из [`event_taxonomy.py`](../../../backend/app/event_taxonomy.py):

| `event_domain` | Подпись в UI | Акцент (lab) |
|----------------|--------------|--------------|
| `consumption` | Повседневное | amber |
| `housing` | Жильё и быт | indigo |
| `health` | Здоровье | rose |
| `insurance` | Страхование | emerald |
| `auto` | Авто | sky |
| `credit_debt` | Кредиты | violet-deep |
| `investment_education` | Обучение | teal |
| `social_family` | Семья | violet |
| `income_work` | Работа | (резерв) |
| `meta` | Системное | mist + violet |

## Что меняется per domain (не отдельная вёрстка)

1. `--ev-accent` → полоса, pill, tint пузыря.  
2. Подпись pill (русский, не snake_case).  
3. Модификатор `insurance_claim` → badge + emerald bubble (поверх домена `auto`).  
4. Опционально: иконка домена 16px в pill (SVG, один набор).

## Реализация (после ★)

```js
// frontend: eventDomainTheme(event.event_domain)
// → { label, accentClass, bubbleModifier }
```

Не хардкодить по `title` — только `event_domain` из API pending event.

## Not doing в R2

- Отдельный layout на домен  
- PNG-иллюстрации на каждый домен  
- Анимации halo (только CSS tint)
