# Finance — страховки

Витрина блока **«Страховки»** в разделе «Капитал»: оформление полиса и список активных.

Модель: **продукт × объект** (`mortgage_life`, `auto_liability` …), поля **сумма выплаты**, **оплата за период**, **срок (периодов)**. При страховом случае — полная выплата, полис закрывается (без частичного лимита).

Канон API/каталога: `backend/app/insurance_catalog.py`, идея: `docs/vision/ideas/insurance-product-parameters.md`.

## Открыть

```bash
cd design-lab/finance-insurance
npx serve .
```

Переключатель **светлая / тёмная** в шапке. Вариант **B** — featured (рекомендация).

## Варианты

| ID | Название | Идея |
|----|----------|------|
| **A** | REF legacy | Select «тип полиса», рамочные поля премия/покрытие, плоский список |
| **B ★** | Каталог + тарифы | Сетка 2×2 → тарифы карточками **asset H** (accent + inline-метрики + «+») |
| **plan G–K** | Карточка тарифа | Сравнение как в [asset-cards](../asset-cards/): **H ★** в prod |
| **C** | Два шага | Табы продукта → чипы объекта → поля |
| **D** | Компакт TMA | Один select, метрики в одну строку, список полисов одной линией |

## Поля (все варианты кроме A)

| UI | API |
|----|-----|
| Продукт + объект | `product`, `insured_object` (или `kind`) |
| Сумма выплаты | `payout_amount` |
| Оплата за период | `monthly_premium` |
| Срок | `term_periods` |

## После выбора

Напишите в чате: **«утверждаем B»** (или A/C/D) → перенос в `frontend-react/src/components/mqx/` (`InsuranceProductForm`, карточка полиса, токены в `index.css`), замена блока в `FinanceSection` / capital layout.

**Prod:** `InsuranceProductPicker`, `InsurancePolicyRow` в `mqx/`, тарифы в `constants/insuranceProducts.js` + `GET /api/insurance/catalog` (`plans`).
