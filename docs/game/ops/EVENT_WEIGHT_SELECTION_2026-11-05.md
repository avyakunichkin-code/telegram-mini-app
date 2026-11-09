---
layer: audit
status: draft
last_reviewed: 2026-11-05
---
# Исправление взвешенного отбора событий

Поручение: следующий шаг после компактных итогов — разнообразие событий.
[Аудит](../vision/analysis/event-catalog-variety-2026-11-05.md) выявил
перевёрнутый отбор. Исправлена только сортировка экспоненциальных ключей
в backend/app/services/events/selection.py: минимум `-ln(U)/weight`
побеждает. Веса YAML, cooldown, потребности, бюджет, tier, once/max, доменная
ротация, приоритетные цепочки, seeds и текущие сохранения не мигрируются.

Игроко-видимое изменение: часто выбранные карточки получают меньший шанс,
а повышающий вес needs rescue действительно повышает шанс помощи низкой
потребности. Это не запрет всех повторов и не изменение наград/расходов.

Новые deterministic regression tests проверяют actual picks: больший вес,
fatigue, rescue multiplier, порядок кандидатов, выбор по uniform draw,
пустой запрос и выбор без дубликатов. До исправления **5failed/3passed**,
после с catalog/taxonomy контрактами **28passed**, exit0.
Статистика 20kdraw и изолированного early pool — в аудите; она не заменяет
полную симуляцию экономики.

Root `C:/Users/Aleksei Iakunichkin/IdeaProjects/telegram-mini-app`.
Python3.13. Команды backend с PYTHON_DOTENV_DISABLED=1, тестовым SECRET_KEY
и SQLite, без реальных данных/уведомлений. Логи `.codex-state/events-weight-*`.
Полный backend pytest завершён. Исходный40p manifest завершился exit1:
10 REGRESSION LIKELY,1 OK. Это исторический срез исправления сортировки.
Последующая YAML-калибровка и её незакрытые риски —
[в текущем отчёте](EVENT_VARIETY_RECALIBRATION_2026-11-05.md).
Baselines не обновляются.
Frontend/SQL/контент не менялись, их проверки не повторялись.

| cwd | Команда | Exit | Результат |
|---|---|---:|---|
| backend | `../.venv/Scripts/python.exe -m pytest -q tests/unit/events/test_weighted_event_selection.py` до исправления | 1 | RED:5failed/3passed |
| backend | pytest нового файла + taxonomy pool + balance contract + YAML catalog | 0 | 28passed,9.21s |
| backend | `../.venv/Scripts/python.exe -u -m pytest -q` | 0 | 704passed,474.45s; fincore/platform включены |

Первый sandbox full pytest завис до TestClient HTTP из-за Windows
socketpair/accept; адресно прерван Ctrl-C (exit1), не считается PASS.
Независимый balance runner подтвердил то же faulthandler stack до первого
POST и также адресно остановил диагностические запуски. Повтор с доступом
к локальным сокетам использует те же временные SQLite и тестовые ключи.
Это не попытка подключения к production.

Изолированный early pool100seed: 12.70→16.21 уникальных из20показов,
повторы7.30→3.79. Ограничения модели подробно названы в аудите.
