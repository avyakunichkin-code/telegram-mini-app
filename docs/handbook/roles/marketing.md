---
layer: handbook
status: active
role: marketing
last_reviewed: 2026-05-30
---

# Маркетинг / партнёр — guide

УТП, стадия, бренд — **без** внутреннего backlog, формул экономики и `handbook/internal/`.

---

## Маршрут (20–40 мин)

1. **[`PRODUCT_BRIEF.md`](../PRODUCT_BRIEF.md)** — vision, ЦА 30+, pillars, MVP 2.0 Plan  
2. **[`ADVISOR_FUNNEL_AUDIENCE.md`](../ADVISOR_FUNNEL_AUDIENCE.md)** — **воронка к финсоветнику** (профили, каналы, lead scoring, тексты для лендинга)  
3. **[`GAME.md`](../GAME.md)** — механики и [воронка](../GAME.md#воронка-привлечения-игроков)  
4. **[`FEATURE_STATUS.md`](../FEATURE_STATUS.md)** — что уже в prod (матрица)  
5. **[`ECONOMY_OVERVIEW.md`](../ECONOMY_OVERVIEW.md)** — обзор экономики **без** tuning  
6. **[`TVOY_HOD_DESIGN_AND_GDD_OUTLINE.md`](../../reference/TVOY_HOD_DESIGN_AND_GDD_OUTLINE.md)** — расширенное оглавление GDD  
7. **[`BRANDBOOK.md`](../../reference/brandbook/BRANDBOOK.md)** · **[`BRANDBOOK_MQX.md`](../../reference/brandbook/BRANDBOOK_MQX.md)**  
8. **[`landing/README.md`](../../../landing/README.md)** — лендинг (локали `ru.json` / `en.json`)  
9. **[`marketing/README.md`](../../marketing/README.md)** — посты и трекер  

---

## Elevator pitch (из prod)

**ТВОЙ ХОД** — умная игра про финансовые решения в формате игровых месяцев: зарплата, подушка, жизненные события, инвестиции и страховки, плюс слой **потребностей** персонажа. Ошибки безопасны, последствия читаются в цифрах.

**Каналы:** Telegram Mini App, браузер, PWA — один продукт, не «только TMA».

**Стадия:** Pre-Alpha; массовый набор не открыт. **MVP 2.0:** режим **Plan** (свой бюджет) — в roadmap обязателен.

**Монетизация:** B2C TBD; рабочая **гипотеза** — игра бесплатно → услуги финсоветника **45–75k ₽** ([`ADVISOR_FUNNEL_AUDIENCE.md`](../ADVISOR_FUNNEL_AUDIENCE.md)).

**Три рычага в креативах (гип.):**

1. «Слепая зона при хорошем доходе»  
2. «Game over в игре — бесплатно; в жизни — нет»  
3. «Не курс на 40 часов — один план под вашу семью»

**P0 каналы:** Telegram (финграмотность / карьера 30+), **партнёр-советник** (UTM `partner_id`).

---

## Не включать во внешние материалы

- `docs/handbook/internal/` — формулы и tuning  
- Сырой `PRODUCT_BACKLOG.md` без контекста  
- Draft specs без пометки «не в prod»  

---

## Воронка финсоветника

- Канон ЦА и креативы: [`ADVISOR_FUNNEL_AUDIENCE.md`](../ADVISOR_FUNNEL_AUDIENCE.md)  
- Партнёр сейчас + расширение штата — §9.6 того же документа  
- Лендинг: черновики блоков в §9.6 → перенос в `landing/public/locales/`  

## TBD (волна 3)

- Одностраничный **factsheet** для партнёров  
- Согласованный набор скринов — [`LANDING_SCREENSHOTS.md`](../../specs/LANDING_SCREENSHOTS.md)  
- Positioning vs конкуренты — отдельная сессия  
- CRM: опрос в игре + `partner_id` (см. checklist в `ADVISOR_FUNNEL_AUDIENCE.md` §9.6)  

---

*Обновлено: 2026-05-30.*
