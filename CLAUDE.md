## Money Quest — контекст проекта (для быстрого онбординга агента)

Этот файл нужен, чтобы “загрузить контекст с нуля”: что это за проект, какие сущности, где логика, как запускать и как продолжать разработку.

### Коротко о продукте
- **Money Quest** — Telegram Mini App-игра по финансовой грамотности.
- **Core loop**: периоды (месяцы) с таймером → игрок делает действия → конец периода применяет правила (списания/доходы/просрочки) → следующий период.
- **Важно (дизайн)**: в **easy** игрок может забыть сделать действия (зарплата по кнопке) → последствия.

---

## Стек
- **Backend**: FastAPI, SQLAlchemy, PostgreSQL, JWT.
- **Frontend**: React + Vite, `@telegram-apps/telegram-ui`, React Router, кастомные хуки.

---

## Где что лежит (backend)
- `backend/main.py`
  - создаёт таблицы `Base.metadata.create_all`
  - делает “лёгкую автомиграцию” некоторых колонок (без Alembic)
  - подключает роутеры
- `backend/app/models.py`
  - `GameProfile` — игровое состояние (period_index, time_state, balances и т.д.)
  - `FinanceSalary`, `FinanceAsset`, `FinanceLiability`
  - `PeriodSnapshot`, `Transaction`
  - Easy механики:
    - события: `EventDefinition`, `EventChoice`, `EventInstance`
    - инвестиции: `InvestmentPosition`
    - страховки: `InsurancePolicy`
- `backend/app/game_time.py`
  - синхронизация времени периода (anchor/duration)
- `backend/app/game_period.py`
  - **главная экономика** на конец периода:
    - обслуживание активов
    - доход от активов (`monthly_income`)
    - платежи по обязательствам → при нехватке денег → `overdue_amount`
    - списание премий страховок
    - начисления по инвестициям (депозит/облигации)
    - поражение по `negative_periods_count` (3 подряд)
    - создание события на новый период (easy)

---

## Роутеры/эндпоинты (важное)

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

### Финансы/обзор
- `GET /api/finance/overview` → главные цифры + прогресс победы (MVP)
- `GET /api/finance/asset-templates`
- `POST /api/finance/assets/from-template`

### События (easy)
- `GET /api/game/events/pending`
- `POST /api/game/events/{event_id}/choose`

### Инвестиции (easy MVP)
- `GET /api/invest/positions`
- `POST /api/invest/deposit/open`
- `POST /api/invest/bond/buy`
- `POST /api/invest/positions/{id}/close`

### Страховки (easy MVP)
- `GET /api/insurance/policies`
- `POST /api/insurance/buy`
- `POST /api/insurance/{id}/cancel`

---

## Где что лежит (frontend)
- `frontend-react/src/api.js`
  - `apiCall` бросает `ApiError` при `!ok` (единый контракт ошибок)
- `frontend-react/src/hooks/useGame.js`
  - загрузка `overview`, `timeStatus`, `periodStatus`
  - таймер и переход периодов
  - загрузка `pendingEvents` (массив из `/api/game/events/pending`)
- `frontend-react/src/components/GameScreen.jsx`
  - шапка: лого MQ + кнопка «События» (бейдж = число активных сценариев)
  - слой `EventCarouselOverlay` поверх интерфейса: слайдер карточек (easy: до трёх за период), закрытие ×
- `frontend-react/src/components/EventDeck.jsx`
  - `EventsTriggerButton`, `EventCarouselOverlay`: два исхода — красная/зелёная кнопки иначе список; перелистывание ‹ › или свайп по полю карты
- `frontend-react/src/components/FinanceSection.jsx`
  - UI инвестиций/страховок/шаблонов/долгов и активов; **вкладки** `.mq-tablist` (не ряд кнопок)
- `frontend-react/src/components/BottomGameNav.jsx` + `icons/NavIcons.jsx`
  - нижняя навигация: главная (дом), финансы (монеты), аналитика (график вверх), меню (бургер)
- `frontend-react/src/components/AnalyticsSection.jsx`
  - мини-обзор и бары по полям `overview`; концепт расширений: `docs/ANALYTICS_CONCEPT.md`
- `frontend-react/src/components/ToastHost.jsx` + `frontend-react/src/components/notifications.js`
  - toast-уведомления вместо `alert`

---

## Правила экономики (easy, текущее состояние)
- **Зарплата**: только по кнопке в текущем периоде; пропустил → сгорела.
- **Обязательства**: пытаются оплатиться; если денег не хватает → накапливается `overdue_amount` (без штрафов на MVP).
- **Доходные активы**: начисляют `monthly_income` в конце периода автоматически.
- **Инвестиции**:
  - депозит капитализируется в `principal`
  - облигации платят купон на баланс
- **Страховки**: списывают премию в конце периода.

---

## Победа (MVP)
Считается в `GET /api/finance/overview`:
- цель: `safety_fund_balance >= 3 * total_monthly_obligations`
- дополнительные условия: `total_overdue_amount == 0` и `net_cashflow >= 0`

---

## Миграции БД
Без Alembic.
- Идемпотентная SQL-миграция: `backend/migrations/0002_easy_mechanics.sql`
- Запуск (Windows): `backend/migrate.ps1` (нужен `psql` и `DATABASE_URL`)

---

## Следующие логичные шаги (после easy)
- Усложнение hard режима: штрафы за просрочки, налоги, бюджетирование, ограничения.
- События: привязать эффекты к страховкам/инвестициям/типам активов.

