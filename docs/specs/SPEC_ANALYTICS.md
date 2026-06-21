---
tags:
  - tvoy-hod/layer/spec
aliases:
  - "вкладка «Аналитика» (ТВОЙ ХОД)"
  - "SPEC ANALYTICS"
  - SPEC_ANALYTICS
  - "Spec: вкладка «Аналитика» (ТВОЙ ХОД)"
layer: spec
domain: analytics
status: active
epic_id: AN1
last_reviewed: 2026-06-21
idea: ../vision/ideas/player-financial-analytics-an1.md
---

# Spec: вкладка «Аналитика» (ТВОЙ ХОД)

Документ фиксирует **вижн и дорожную карту** экрана финансовой аналитики: состояние, анализ, прогноз, автоматические рекомендации.

**Эпик:** [AN1](../backlog/PRODUCT_BACKLOG.md#эпик-an1--финансовая-аналитика-игрока) · **Idea (approved):** [player-financial-analytics-an1](../vision/ideas/player-financial-analytics-an1.md) · **Лексика:** [post-playtest §лексика](../vision/ideas/post-playtest-wave1-two-directions.md) · **Метрики:** [ADR-009](../decisions/ADR-009-metrics-dictionary-tb1.md).

### Определение продукта

| Вопрос | Ответ |
|--------|--------|
| Где в UI? | Вкладка **«Аналитика»** (`AnalyticsPremium` → полная переписка). |
| «Дашборд реальных данных» (Plan) | **Лексика**; не отдельный экран. |
| Game vs Plan | Один экран; ветвление **данных** по `save_kind`. Пользователь сам решает, вводить личные или «общие» цифры — **без** режима «семья/личное». |
| Фокус | **Финансовые KPI, динамика, прогноз 3/6/12 мес., рекомендации.** Победа — не в фокусе (макс. одна строка внизу, Game). |
| Пороги зон | **Единые стандарты** личных/банковских финансов; **не** от сложности шаблона Game. |
| E1 | Углубляет breakdown burn; **не блокирует** AN1-0. |
| Не это | **A0/PA2** — ops analytics в admin. |

---

## 1. Цели экрана

| Цель | Как поддерживается |
|------|--------------------|
| **Текущее состояние** | Ликвидность (cash + safety), зона устойчивости, остаток после **полного** outflow |
| **Осмыслить месяц** | Водопад: доход → долги → обслуживание → жизнь → остаток |
| **Риски** | ПДН, просрочка, подушка в месяцах давления, runway |
| **Динамика** | Timeseries, таблица закрытий, `avg_net_cashflow_6p` |
| **Траектория** | Прогноз **3 / 6 / 12 мес.** при текущей модели |
| **Рекомендации** | Rule engine на BE → карточки на FE (автоматизация — целевая архитектура) |
| **Победа (Game)** | Опционально внизу; stepper целей — только на **главной** (`MqxGoalDash`) |

---

## 2. Принципы UX

1. **Один главный KPI на блок** — подписи единиц и смысла (см. ADR-009).  
2. **Термины = экономика месяца** — как на главной и в «Капитале».  
3. **Стандарты, не «уровень сложности»** — зоны комфорт/внимание/критично из config порогов.  
4. **Прогноз — ориентир**, не обещание: disclaimer про события и сделки.  
5. **Ранние периоды** — пустые состояния с короткой подсказкой Монетки.  
6. **Цвет как смысл** — брендбук; a11y: текстовые дубли у баров.

---

## 3. Структура экрана (канон AN1)

Порядок блоков сверху вниз:

| # | Блок | Содержание |
|---|------|------------|
| 1 | **Снимок** | Ликвидность; chip зоны (зелёный/жёлтый/красный); остаток после full outflow |
| 2 | **Поток месяца** | Водопад статей + % от дохода |
| 3 | **Устойчивость** | Подушка (мес. давления), ПДН, runway, просрочка, clean streak |
| 4 | **Динамика** | Sparklines; таблица последних 6 закрытий |
| 5 | **Прогноз** | Segmented **3 \| 6 \| 12** мес.; ликвидность на горизонте |
| 6 | **Рекомендации** | 1 главная + до 2 вторичных (`MqxInsightCard`) |
| 7 | **Победа** *(Game, optional)* | Одна строка / ссылка «цели на главной» |

### 3.1. Стандарты порогов (config)

Хранить в `analytics_thresholds` (JSON в app config или seed); **одинаково для Game и Plan**.

| Ключ | Дефолт (ориентир) | Использование |
|------|-------------------|---------------|
| `cushion_months_comfort` | 6 | Зелёная зона подушки |
| `cushion_months_min` | 3 | Жёлтая ниже — внимание |
| `dti_attention_pct` | 40 | ПДН / `liabilities_to_income_ratio` |
| `dti_critical_pct` | 50 | Критичная зона |
| `burn_income_attention_pct` | 50 | Lifestyle / доход |
| `runway_critical_months` | 1 | Runway по обязательствам |

Банковский контекст ПДН и нормы ликвидности — для **копирайта** и rule engine, не для изменения игрового баланса шаблонов.

### 3.2. Метрики снимка (ADR-009)

| Показатель | Поля / формула |
|------------|----------------|
| Ликвидность | `cash_balance + safety_fund_balance` |
| Structural net | `net_monthly_cashflow` |
| Lifestyle burn | `monthly_burn_total` / `getMonthlyBurn` |
| Full outflow | `structural_obligations + lifestyle_burn` (= `total_monthly_outflow` когда в overview) |
| **Остаток месяца** | `total_income_steady − full_outflow` (явный KPI в UI) |
| Подушка в месяцах | `safety / pressure_monthly` (из victory snap / overview) |
| ПДН | `liabilities_to_income_ratio` |

**Правило UI:** если текст про «хватит ли на жизнь» — показывать **остаток после full outflow**, не только structural net.

### 3.3. Прогноз 3 / 6 / 12 месяцев

- **UI:** `MqxSegmentedControl` — 3 | 6 | 12.  
- **Модель v1:** `liquidity_now + months × monthly_delta`, где `monthly_delta` = среднее Δ(cash+safety) по последним закрытиям (до 6), иначе `net_monthly_cashflow − lifestyle_burn` (оценка).  
- **Не моделируем:** события, новые кредиты/покупки.  
- **Copy:** «Если ближайшие месяцы похожи на текущую финансовую модель».

Заменяет текущий фиксированный блок «счёт через 12 ходов» без переключателя.

### 3.4. Рекомендации (rule engine)

**Endpoint (целевой):** `GET /api/finance/analytics/insights`

```json
{
  "insights": [
    {
      "id": "overdue_positive",
      "severity": "critical",
      "title": "Есть просрочка",
      "body": "…",
      "metric_refs": { "total_overdue_amount": 12000 },
      "dedupe_key": "overdue"
    }
  ]
}
```

| severity | Поведение UI |
|----------|----------------|
| `critical` | Главная карточка |
| `warning` | Вторичная |
| `info` | Вторичная или свёрнуто |

**Правила v1 (BE, автоматические):**

- `total_overdue_amount > 0`
- `liabilities_to_income_ratio` ≥ `dti_critical_pct` / `dti_attention_pct`
- `cushion_months < cushion_months_min`
- остаток после full outflow < 0
- `burn / income` ≥ `burn_income_attention_pct`
- тренд: `avg_net_cashflow_6p < 0` при n ≥ 3

Шаблоны текстов RU — data-driven (подстановка сумм/%). Ручной контент — исключение, не архитектура.

**Граница:** без CTA внешнего советника в Pre-Alpha ([`ADVISOR_FUNNEL_AUDIENCE`](../handbook/ADVISOR_FUNNEL_AUDIENCE.md)).

---

## 4. Контент по фазам реализации

### Фаза A — AN1-0 (без E1)

**API:** `GET /api/finance/overview`, `GET /api/finance/analytics/timeseries?limit=48`.

- Снимок + водопад + устойчивость по стандартам.  
- Прогноз 3/6/12.  
- Убрать произвольные `capitalTarget` / сводный `goalsProgress` из legacy UI.

### Фаза B — AN1-1

- Таблица 6 закрытий; расширение timeseries (burn, overdue по точкам).  
- `GET .../analytics/insights` v1.  
- Plan: первый экран после квиза.

### Фаза C — AN1-2

- Сценарии «если» (без зарплаты / без событий) — лайт на клиенте от снимка.  
- Расширение каталога правил; breakdown по категориям при **E1**.

### Фаза D — опционально

- Личная статистика за N партий (без лидербордов).  
- **Не** сравнение с «идеальной победой» на этом экране.

---

## 5. Визуализации

| Вид | Назначение |
|-----|------------|
| Горизонтальные bars / водопад | Структура месяца |
| Sparklines | cash, safety, burn по закрытиям |
| Segmented forecast | 3/6/12 мес. |
| Таблица периодов | a11y, без графика |
| Insight cards | Рекомендации |

**Не использовать** на этом экране: gauge «прогресс победы», сводный % целей игрока (дублирует главную).

---

## 6. Источники данных

| Данные | Сейчас | AN1 |
|--------|--------|-----|
| Снимок | `FinanceOverview` | + `residual_after_full_outflow` (поле или documented client calc) |
| История | `analytics/timeseries` | + поля в точках: burn, overdue |
| Insights | — | `analytics/insights` |
| Пороги | — | `analytics_thresholds` config |
| Категории расходов | частично | E1 → фаза C |

---

## 7. Техника (SPA / PWA)

Каналы: [ADR-012](../decisions/ADR-012-primary-channels-pwa-web-over-tma.md).

- CSS-bars + нативный скролл; тяжёлые chart-lib — только при необходимости.  
- Rule engine **на бэкенде** — единый источник для FE и будущих каналов (TG digest и т.д.).

---

## 8. Связанные документы

| Файл | Содержание |
|------|------------|
| [player-financial-analytics-an1](../vision/ideas/player-financial-analytics-an1.md) | Approved product decisions |
| [ADR-009](../decisions/ADR-009-metrics-dictionary-tb1.md) | Словарь метрик |
| [SPEC_victory-v2](features/SPEC_victory-v2.md) | Победа — главный экран, не аналитика |
| [`PRODUCT_BACKLOG.md`](../backlog/PRODUCT_BACKLOG.md) | AN1-* задачи |
| [`SPEC_FRONTEND_UI.md`](SPEC_FRONTEND_UI.md) | MQX |

---

*После playtest: какие два блока открывают чаще — поднять выше; пороги config калибровать по фидбеку, не по шаблону Game.*
