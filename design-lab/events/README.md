# Events — оверлей и карточка

**Статус:** **M2 ★ утверждён** → prod (`EventCard`). Выборы — flat без emerald-кнопки.

Запуск:

```bash
cd design-lab/events
npx serve .
```

Открыть `index.html` — прокрутить до «Раунд 2». Ideation: [`IDEATION.md`](./IDEATION.md).

## Раунд 1 (legacy)

| ID | Идея |
|----|------|
| **A** | Текущий prod (рамка + violet outline) |
| **B** | Flat D′ |
| **B′ ★** | B + бейдж «Страховой случай» + emerald primary на выборе с полисом |

## Раунд 2 — Монетка (PNG `assets/monetka-mascot.png`)

| ID | Идея |
|----|------|
| **M6 ★** | Страховой бриф: emerald halo, пульс, Монетка 64px |
| **M1** | Компактный ряд: Монетка слева, chips, desc 2 строки |
| **M2** | Реплика в пузыре (description в bubble) |
| **M3** | Шапка-полоса: gradient hero, Монетка на кромке |
| **M4** | Колонка-визуал: кольцо + rail |
| **M5** | Ультра-компакт: 44px, мелкие выборы |

## API

`GET /api/game/events/pending` — у выбора с `insurance_claim` в effects: `"insurance_claim": true`, опционально `xp_delta`.
