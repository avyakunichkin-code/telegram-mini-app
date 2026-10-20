# Backend application (`app/`)

Модульный монолит: **роутеры** — HTTP, **services/** — use-cases API, **доменные пакеты** — правила и расчёты, **корень** — платформа.

## Слои

```text
app/
├── routers/          # FastAPI: auth, game, period, finance, events, …
├── services/         # тонкие use-cases под роутеры (см. services/README.md)
├── game/             # период, время, bootstrap, rules, start_validation
├── finance/          # overview_build, expenses, balance, period_metrics; annuity/liability_kinds/invest_products — адаптеры над packages/fincore
├── victory/          # engine, seeds, snap, goals, mechanics_progression
├── events/           # chains, taxonomy, mvp11, constants, insurance_hooks
├── needs/            # engine (decay, needs_delta), set_point (износ, уровень жизни L), value_curve (цена балла), guide_content
├── achievements/     # engine, seeds
├── starters/         # mechanics, templates, insurance_catalog
├── admin/            # auth, catalogs, notify, onboarding funnel
├── seeds/            # bootstrap-данные для main.py
├── models.py         # SQLAlchemy
├── schemas.py        # Pydantic
├── auth.py, database.py, config.py, …
```

## Куда класть новый код

| Тип | Путь |
|-----|------|
| Эндпоинт | `routers/<domain>.py` + вызов `services/<domain>/` |
| Правило домена (без HTTP) | `app/<domain>/` |
| Финансовый расчёт, нужный и Plan (без ORM, без игровых понятий) | `packages/fincore/` + адаптер в `app/finance/` ([ADR-016](../../docs/decisions/ADR-016-two-products-shared-fincore.md)) |
| Общая инфраструктура | корень `app/` |
| Сиды каталогов | `seeds/` |

## Связь с `services/`

- **services** — оркестрация под конкретный API-запрос (валидация профиля, commit, ответ).
- **app/game**, **app/finance**, … — переиспользуемая логика; может вызываться из `game.period`, overview, тестов.

Не дублировать одно и то же в двух местах без причины: новый код — в доменный пакет, роутер/service — тонкая обёртка.

## Эволюция

См. [`services/README.md`](services/README.md): контракты API, очереди для тяжёлого, observability, при декомпозиции сначала периферия (admin notify, аналитика, каталоги).
