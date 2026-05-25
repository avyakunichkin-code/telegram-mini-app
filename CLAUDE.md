## ТВОЙ ХОД — контекст проекта (для быстрого онбординга агента)

Этот файл нужен, чтобы «загрузить контекст с нуля»: что это за проект, какие сущности, где логика, как запускать и как продолжать разработку.

| Документ | Назначение |
|----------|------------|
| [`docs/README.md`](docs/README.md) | Оглавление папки `docs/` и слои документации |
| [`docs/DOCUMENTATION_SYSTEM.md`](docs/DOCUMENTATION_SYSTEM.md) | Конвейер idea → spec → plan → tasks |
| [`docs/foundation/SPEC_PRODUCT.md`](docs/foundation/SPEC_PRODUCT.md) | Продукт, цикл, экономика; §7.1 — Victory v2 в prod |
| [`docs/foundation/DOC_SYNC_LOG.md`](docs/foundation/DOC_SYNC_LOG.md) | Журнал синхронизации docs ↔ prod |
| [`docs/decisions/ADR-002-victory-engine-and-template-config.md`](docs/decisions/ADR-002-victory-engine-and-template-config.md) | Движок победы, chain / parallel |
| [`docs/decisions/ADR-004-mechanics-unlock-victory-chain.md`](docs/decisions/ADR-004-mechanics-unlock-victory-chain.md) | Разблокировка механик по целям |
| [`docs/vision/ideas/remove-character-xp-and-levels.md`](docs/vision/ideas/remove-character-xp-and-levels.md) | **Канон прогрессии:** `event_tier` от `period_index`, без character level/XP |
| [`docs/vision/ideas/remove-character-xp-and-levels.md`](docs/vision/ideas/remove-character-xp-and-levels.md) | Прогрессия: `event_tier` от `period_index`, без level/XP |
| [`docs/vision/ideas/tvoy-hod-evolution-after-mvp.md`](docs/vision/ideas/tvoy-hod-evolution-after-mvp.md) | **Часть II** — целевая концепция Game/Plan, шаблоны, победа из шаблона, Q&A, план по слоям |
| [`docs/backlog/PRODUCT_BACKLOG.md`](docs/backlog/PRODUCT_BACKLOG.md) | Бэклог по слоям |
| [`docs/foundation/TMA_USER_FLOWS.md`](docs/foundation/TMA_USER_FLOWS.md) | Потоки и боли TMA |
| [`docs/specs/SPEC_ANALYTICS.md`](docs/specs/SPEC_ANALYTICS.md) | Экран аналитики и данные |
| [`docs/specs/LANDING_SCREENSHOTS.md`](docs/specs/LANDING_SCREENSHOTS.md) | Скрины UI на лендинге: `capture-screens.mjs`, `UI_FOCUS`, пересъём |
| [`landing/README.md`](landing/README.md) | Статический лендинг `/landing/` (Vite, локали, `public/screens/`) |
| [`docs/specs/SPEC_APP_SHELL.md`](docs/specs/SPEC_APP_SHELL.md) | Pre-game: оболочки Bubble/Flow, `MqxButton` |
| [`docs/reference/TVOY_HOD_DESIGN_AND_GDD_OUTLINE.md`](docs/reference/TVOY_HOD_DESIGN_AND_GDD_OUTLINE.md) | GDD-оглавление и анализ |
| [`docs/vision/ideas/game-balance-thresholds-and-constraints.md`](docs/vision/ideas/game-balance-thresholds-and-constraints.md) | Черновик порогов баланса (победа, поражение, MVP-ограничения), idea-refine |
| [`docs/vision/ideas/project-structure-standardization.md`](docs/vision/ideas/project-structure-standardization.md) | Структура репо: screens/api/seeds, touch-it move-it (idea-refine) |

---

### Коротко о продукте

- **ТВОЙ ХОД** — Telegram Mini App: **игра по финансовой грамотности** с периодами («месяц»), балансами, обязательствами, событиями.
- **Core loop:** период с таймером → действия игрока → конец периода (`process_period_end`: списания, доходы, просрочки, инвестиции, страховки, снимки, новые события) → следующий период.
- **Текущий MVP:** зарплата по кнопке (пропуск периода → выплата за период не повторяется), подушка, активы/долги из шаблонов БД, до трёх событий на период, инвестиции и страховки.
- **Режимы сохранения:** **`save_kind`**: `game` \| `plan` (immutable после создания). **Game** — старт из каталога **`game_starter_templates`** (`starter_template_key`, blueprint, `base_monthly_lifestyle_expense`), без экрана ручных базовых параметров на входе. **Plan** — заложен в API и модели; в UI пока заглушка «Скоро» (мастер и префилл — MVP 2.0). Legacy **`light` / `hardcore`** и **`DifficultyScreen`** сняты; фильтр событий использует семантику **`game` / `plan` / `any`** на **`EventDefinition.mode`** в связке с **`profile.save_kind`** ([ADR-001](docs/decisions/ADR-001-save-kind-remove-light-hardcore.md)).

---

## Стек

- **Backend:** FastAPI, SQLAlchemy, PostgreSQL, JWT.
- **Frontend:** React + Vite, `@telegram-apps/telegram-ui`, React Router, кастомные хуки.

---

## Где что лежит (backend)

- `backend/main.py` — `Base.metadata.create_all`, лёгкая автомиграция отдельных колонок (без Alembic), подключение роутеров.
- `backend/app/models.py` — `GameProfile` (`save_kind`, `starter_template_key`, `base_monthly_lifestyle_expense`, `delta_monthly_lifestyle_expense`, период и балансы); `GameStarterTemplate`; `FinanceSalary`, `FinanceAsset`, `FinanceLiability`, …; события `EventDefinition`, `EventChoice`, `EventInstance`; каталоги активов/долгов и др.
- `backend/app/game_time.py` — синхронизация времени периода (anchor / duration).
- `backend/app/game_period.py` — **главная экономика на конец периода:** обслуживание активов, доход активов, платежи по обязательствам и просрочка, премии страховок, инвестиции, поражение при трёх подряд периодах с отрицательным `cash`, события нового периода.
- `backend/app/finance_overview_build.py` + `backend/app/victory_engine.py` — **`GET /api/finance/overview`** (сборка в `routers/finance.py`): победа **Victory v2** из `victory_config_json` шаблона, блок **`victory`**, **`win_reached`**; ранний запрет периодов — `min_period_index_for_victory` (обычно **7**). См. [ADR-002](docs/decisions/ADR-002-victory-engine-and-template-config.md).

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

- `GET /api/finance/overview` — главные цифры, прогресс победы MVP, `clean_period_streak`, таймер периода; поля **`avg_net_cashflow_6p`** / **`avg_net_cashflow_6p_n`** (задел под victory v2)
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

- `GET/POST /api/game/profiles`, **`GET /api/game/templates`**, старт партии — см. `backend/app/routers/game.py`: **`save_kind`**, для Game — **`template_key`** и применение blueprint.

---

## Где что лежит (frontend)

- **Структура frontend:** [`frontend-react/ARCHITECTURE.md`](frontend-react/ARCHITECTURE.md) (`screens/`, `api/*`, `styles/`).
- `frontend-react/src/api.js` — barrel → `api/` (`apiCall`, `API`, `ApiError`).
- `frontend-react/src/hooks/useGame.js` — `overview`, `timeStatus`, `periodStatus`, таймер, переход периодов, `pendingEvents`.
- `frontend-react/src/components/GameScreen.jsx` — шапка, события, оверлей карусели.
- `frontend-react/src/components/EventDeck.jsx` — кнопка событий, `EventCarouselOverlay`, свайп/стрелки.
- `frontend-react/src/components/FinancePremium.jsx` — вкладка «Финансы»: доходы/расходы, инвестиции, страховки, имущество, обязательства (аккордеоны по `overview.mechanics`).
- `frontend-react/src/components/BottomGameNav.jsx` + `icons/NavIcons.jsx` — нижняя навигация.
- `frontend-react/src/components/AnalyticsSection.jsx` / **AnalyticsPremium**, **DashboardPremium** — обзор и цели; spec: [`docs/specs/SPEC_ANALYTICS.md`](docs/specs/SPEC_ANALYTICS.md).
- `frontend-react/src/components/ToastHost.jsx` + `notifications.js` — тосты вместо `alert`.
- `frontend-react/src/components/mqx/` — компонентная база MQX; **новые или существенно меняющие вид** UI-паттерны — только по согласованному циклу в [`DESIGN_WORKFLOW.md`](frontend-react/src/components/mqx/DESIGN_WORKFLOW.md) (`design-lab` → утверждение → `mqx/` → `#/dev/mqx` → prod; исключение: багфикс/hotfix).
- Поток **новой игры:** `StartMenuScreen` → **`NewProfileKindScreen`** (имя + плитки **Игра / План**; Plan неактивен) → **`GameTemplatePickScreen`** (каталог шаблонов + длительность периода + создание профиля) → **`GameScreen`**. **`BaseParamsScreen`** остаётся в коде под будущий мастер **Plan**, не используется для старта Game. Переиспользуемый выбор шаблона: `GameStarterPicker` (опция ручного сценария для Game выключена).

---

## Правила экономики (текущий MVP)

- **Зарплата:** только по кнопке в текущем периоде; не забрал до конца периода → за период не повторяется.
- **Обязательства:** платёж в конце периода; не хватило cash → рост `overdue_amount` (штрафы как отдельная механика — в бэклоге).
- **Доходные активы:** `monthly_income` в конце периода.
- **Инвестиции:** депозит капитализируется в `principal`; облигации — купон на cash.
- **Страховки:** премия в конце периода.

---

## Победа (prod: Victory v2)

Считается в **`GET /api/finance/overview`** через **`victory_engine.evaluate_victory`** и конфиг **`game_starter_templates.victory_config_json`** ([ADR-002](docs/decisions/ADR-002-victory-engine-and-template-config.md), spec [`SPEC_victory-v2`](docs/specs/features/SPEC_victory-v2.md)):

- **`progression_mode: chain`** (tutorial, все 4 Game-шаблона в prod): победа, когда **все шаги цепочки** выполнены и **`period_index >= min_period_index_for_victory`** (дефолт **7**).
- **`progression_mode: parallel`** (legacy в `VICTORY_CONFIG_LEGACY_BY_TEMPLATE_KEY`): **M из N** среди `enabled` целей + то же ворота периода.
- Блок **`overview.victory`** — цели, `met`, `progression_mode`, текущий шаг; legacy-поля `win_target_safety_fund` / `win_ready` — для UI подушки.
- Разблокировка вкладок капитала по **`blueprint.mechanics_unlock`** после ключей целей — [ADR-004](docs/decisions/ADR-004-mechanics-unlock-victory-chain.md).

**Устаревшее (только тесты):** `evaluate_mvp_victory` в `game_rules.py` — AND «подушка 3× + нет просрочки + cashflow ≥ 0».

**Идеи роста:** avg liquid за 6 периодов, новые типы целей — [`tvoy-hod-evolution-after-mvp.md`](docs/vision/ideas/tvoy-hod-evolution-after-mvp.md) §II.

---

## Миграции БД

Без Alembic.

- Каталог: [`backend/migrations/`](backend/migrations/) — процедура и нумерация: [`backend/migrations/README.md`](backend/migrations/README.md).
- Прогон: [`backend/migrate.ps1`](backend/migrate.ps1) (нужны `psql` и `DATABASE_URL`); дополнительно при старте API — лёгкая автомиграция в `backend/main.py`.

---

## Следующие шаги (согласовано с документацией)

1. **Plan Mode:** мастер ввода, префилл из **`starter_params_json`**, активация плитки Plan в UI — см. **evolution §II.3**.
2. **Victory v2:** движок **M из N** из шаблона; связать **`avg_net_cashflow_6p`** с условиями победы вместо только MVP-правила.
3. **UI:** список сохранений с бейджами **`game` / `plan`** и меткой сложности шаблона для Game.
4. Расширение событий (уровень, повторяемость, эффекты на месячные расходы).
5. Механики давления (штрафы просрочки, налоги) — после стабилизации контрактов API.
