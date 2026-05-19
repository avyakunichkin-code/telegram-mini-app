# Events — оверлей и карточка

**Статус:** **B′ утверждён** → внедрено в MQX (`EventCard`, `EventChoiceButton`).

Запуск:

```bash
cd design-lab/events
npx serve .
```

## Варианты

| ID | Идея |
|----|------|
| **A** | Текущий prod (рамка + violet outline) |
| **B** | Flat D′ |
| **B′ ★** | B + бейдж «Страховой случай» + emerald primary на выборе с полисом |

## API

`GET /api/game/events/pending` — у выбора с `insurance_claim` в effects: `"insurance_claim": true`, опционально `xp_delta`.
