## Money Quest — контекст проекта (для быстрого онбординга агента)

Этот файл нужен, чтобы «загрузить контекст с нуля»: что это за проект, какие сущности, где логика, как запускать и как продолжать разработку.

| Документ | Назначение |
|----------|------------|
| [`docs/README.md`](docs/README.md) | Оглавление папки `docs/` |
| [`docs/SPEC_PRODUCT.md`](docs/SPEC_PRODUCT.md) | Продукт, цикл, экономика MVP, ссылки на рост |
| [`docs/ideas/money-quest-evolution-after-mvp.md`](docs/ideas/money-quest-evolution-after-mvp.md) | **Часть II** — целевая концепция Game/Plan, шаблоны, победа из шаблона, Q&A, план по слоям |
| [`docs/PRODUCT_BACKLOG.md`](docs/PRODUCT_BACKLOG.md) | Бэклог по слоям |
| [`docs/TMA_USER_FLOWS.md`](docs/TMA_USER_FLOWS.md) | Потоки и боли TMA |
| [`docs/ANALYTICS_CONCEPT.md`](docs/ANALYTICS_CONCEPT.md) | Экран аналитики и данные |
| [`docs/MONEY_QUEST_DESIGN_AND_GDD_OUTLINE.md`](docs/MONEY_QUEST_DESIGN_AND_GDD_OUTLINE.md) | GDD-оглавление и анализ |

---

### Коротко о продукте

- **Money Quest** — Telegram Mini App: **игра по финансовой грамотности** с периодами («месяц»), балансами, обязательствами, событиями.
- **Core loop:** период с таймером → действия игрока → конец периода (`process_period_end`: списания, доходы, просрочки, инвестиции, страховки, снимки, новые события) → следующий период.
- **Текущий MVP:** зарплата по кнопке (пропуск периода → выплата за период не повторяется), подушка, активы/долги из шаблонов БД, до трёх событий на период, инвестиции и страховки.
- **Целевая модель (в разработке, см. evolution §II):** два **неизменяемых** режима сохранения — **Game** (шаблоны старта, агрегированные «жизненные» расходы, цели победы из шаблона, прогрессия уровня/достижений) и **Plan** (ручной ввод, статьи расходов, префилл стартового снимка из другого сохранения). В коде пока остаётся устаревшая пара **`GameProfile.mode`**: `light` / `hardcore` и фильтр событий — планируется замена на **`save_kind`**: `game` \| `plan` + поля шаблона (**только по согласованному PR** с миграцией).

---

## Стек

- **Backend:** FastAPI, SQLAlchemy, PostgreSQL, JWT.
- **Frontend:** React + Vite, `@telegram-apps/telegram-ui`, React Router, кастомные хуки.

---

## Где что лежит (backend)

- `backend/main.py` — `Base.metadata.create_all`, лёгкая автомиграция отдельных колонок (без Alembic), подключение роутеров.
- `backend/app/models.py` — `GameProfile` (в т.ч. `period_index`, `time_state`, `cash_balance`, `safety_fund_balance`, `level`, `xp`, `clean_period_streak`, устар. `mode`), `FinanceSalary`, `FinanceAsset`, `FinanceLiability`, `PeriodSnapshot`, `Transaction`, `PeriodEconomyClosing`; события `EventDefinition`, `EventChoice`, `EventInstance`; `InvestmentPosition`, `InsurancePolicy`; каталоги `AssetTemplate`, `LiabilityTemplate`.
- `backend/app/game_time.py` — синхронизация времени периода (anchor / duration).
- `backend/app/game_period.py` — **главная экономика на конец периода:** обслуживание активов, доход активов, платежи по обязательствам и просрочка, премии страховок, инвестиции, поражение при трёх подряд периодах с отрицательным `cash`, события нового периода.
- `backend/app/routers/finance.py` — **`GET /api/finance/overview`** (в т.ч. условие победы MVP и **`win_reached`** только при **`period_index >= 7`** — первые шесть периодов без победы).

---

## Роутеры / эндпоинты (важное)

### Время

- `GET /api/game/time`
- `POST /api/game/time/play`
- `POST /api/game/time/pause`
- `POST /api/game/time/next` → завершает период через `process_period_end`

### Периодные действия

- `POST /api/game/period/claim-salary`
- `POST /api/game/period/contribute-to-safety-fund`
- `POST /api/game/period/withdraw-from-safety-fund`
- `GET /api/game/period/status`

### Финансы / обзор

- `GET /api/finance/overview` — главные цифры, прогресс победы MVP, `clean_period_streak`, таймер периода
- `GET /api/finance/analytics/timeseries` — ряд закрытий периодов + текущая проекция
- `GET /api/finance/asset-templates`
- `POST /api/finance/assets/from-template`

### События

- `GET /api/game/events/pending`
- `POST /api/game/events/{event_id}/choose`

### Инвестиции (MVP)

- `GET /api/invest/positions`
- `POST /api/invest/deposit/open`
- `POST /api/invest/bond/buy`
- `POST /api/invest/positions/{id}/close`

### Страховки (MVP)

- `GET /api/insurance/policies`
- `POST /api/insurance/buy`
- `POST /api/insurance/{id}/cancel`

### Профили игры

- `GET/POST /api/game/profiles` и связанные (см. `backend/app/routers/game.py`) — создание профиля с **`mode` light/hardcore** (legacy до внедрения `save_kind`).

---

## Где что лежит (frontend)

- `frontend-react/src/api.js` — `apiCall`, `ApiError` при `!ok`.
- `frontend-react/src/hooks/useGame.js` — `overview`, `timeStatus`, `periodStatus`, таймер, переход периодов, `pendingEvents`.
- `frontend-react/src/components/GameScreen.jsx` — шапка, события, оверлей карусели.
- `frontend-react/src/components/EventDeck.jsx` — кнопка событий, `EventCarouselOverlay`, свайп/стрелки.
- `frontend-react/src/components/FinanceSection.jsx` — инвестиции, страховки, шаблоны, долги, активы; вкладки `.mq-tablist`.
- `frontend-react/src/components/BottomGameNav.jsx` + `icons/NavIcons.jsx` — нижняя навигация.
- `frontend-react/src/components/AnalyticsSection.jsx` / **AnalyticsPremium**, **DashboardPremium** — обзор и цели; концепт: `docs/ANALYTICS_CONCEPT.md`.
- `frontend-react/src/components/ToastHost.jsx` + `notifications.js` — тосты вместо `alert`.
- Поток старта: `StartMenuScreen` → **`DifficultyScreen`** (legacy light/hardcore) → `BaseParamsScreen` → `GameScreen` — **планируется** выбор Game/Plan и шаблонов (см. evolution §II.3).

---

## Правила экономики (текущий MVP)

- **Зарплата:** только по кнопке в текущем периоде; не забрал до конца периода → за период не повторяется.
- **Обязательства:** платёж в конце периода; не хватило cash → рост `overdue_amount` (штрафы как отдельная механика — в бэклоге).
- **Доходные активы:** `monthly_income` в конце периода.
- **Инвестиции:** депозит капитализируется в `principal`; облигации — купон на cash.
- **Страховки:** премия в конце периода.

---

## Победа (текущий MVP в коде)

Считается в `GET /api/finance/overview` (`backend/app/routers/finance.py`):

- подушка ≥ **3 ×** `total_monthly_obligations` (платежи по долгам + обслуживание активов);
- `total_overdue_amount == 0`;
- `net_monthly_cashflow >= 0`;
- **`win_reached` = true` только если `period_index >= 7`** (периоды 1–6 победы нет — технический и продуктовый запрет).

**Дальше:** победа **M из N целей** из шаблона, средний cashflow за 6 периодов, пороги кэша/cashflow из шаблона — см. [`docs/ideas/money-quest-evolution-after-mvp.md`](docs/ideas/money-quest-evolution-after-mvp.md) §II.

---

## Миграции БД

Без Alembic.

- SQL: `backend/migrations/0002_easy_mechanics.sql`, `0003_asset_liability_templates_events.sql`, …
- Windows: `backend/migrate.ps1` (нужны `psql` и `DATABASE_URL`).

---

## Следующие шаги (согласовано с документацией)

1. Схема **`save_kind`**, шаблоны старта, `starter_params_json`, расширение событий (уровень, повторяемость, эффекты на месячные расходы) — см. **evolution §II.3**.
2. Движок победы по шаблону + поле **среднего чистого cashflow за 6 периодов** в overview.
3. UI: выбор Game/Plan, список сохранений с бейджами, замена `DifficultyScreen` на поток шаблонов.
4. Связка событий со страховками и типами активов (узкий первый слой).
5. Отдельные механики «давления» (штрафы просрочки, налоги) — после стабилизации режимов и контрактов API.
