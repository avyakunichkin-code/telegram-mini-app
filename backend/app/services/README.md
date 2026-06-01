# Service layer (`app/services/`)

Бизнес-логика API: **роутеры тонкие**, правила и расчёты — здесь. Зеркало доменов из `backend/app/routers/` и продуктовых границ MVP.

## Пакеты

| Пакет | Ответственность | Роутер |
|-------|-----------------|--------|
| `game/` | профили, шаблоны старта, `start`, время периода | `routers/game.py` |
| `period/` | зарплата за период, подушка, treat-self, snapshot, complete | `routers/period_actions.py` |
| `finance/` | salary, assets, liabilities, templates, transactions, overview, analytics | `routers/finance.py` |
| `events/` | пул событий, pending, выбор | `routers/events.py` |
| `expenses/` | burn / строки бюджета Plan | `routers/expenses.py` |
| `insurance/` | полисы, премии (в т.ч. из `game_period`) | `routers/insurance.py` |
| `invest/` | депозиты, облигации | `routers/invest.py` |

**Не в services (пока):** ядро экономики конца периода — `game/period.py`; сборка overview/победы — `finance/overview_build.py`, `victory/engine.py` (тяжёлые read-модели, трогаем осознанно).

## Правила

1. Новый код — в пакет домена, не в корень `services/`.
2. Между пакетами — только через публичные функции модуля или `app/*` хелперы; без импорта «внутренностей» чужого роутера.
3. Контракт API: меняем `schemas.py` + `frontend-react/src/api/` в одном PR.
4. Тесты импортируют `app.services.<domain>.<module>`, не роутер.

## Эволюция (из архитектурных рекомендаций)

| Направление | Сейчас | Следующий шаг |
|-------------|--------|----------------|
| Модульные границы | пакеты по домену | при росте — подпакеты (`finance/overview/`) |
| Фоновые задачи | синхронно в request | очередь для рассылок, тяжёлой аналитики, отчётов |
| Наблюдаемость | обычные логи | correlation id, structlog, метрики на границах роутеров |
| Декомпозиция | монолит | первыми выносить **периферию** (уведомления, телеметрия, каталоги контента), не ядро экономики |

Карта всего `app/`: [`../README.md`](../README.md).

См. также [`docs/vision/ideas/project-structure-standardization.md`](../../../docs/vision/ideas/project-structure-standardization.md).
