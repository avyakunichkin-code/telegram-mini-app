# P3-02 · действия внутри шага · 2026-11-05

Владелец утвердил доработанный компактный B словами «Супер, утверждаем».
Канон — [APPROVED](../../design-lab/plan-checkup/APPROVED.md),
состояния — [lab](../../design-lab/plan-checkup/actions-round/index.html).

## Реализовано

- Для правил 1–7 и 11 добавлены 1–3 действия со стабильными ключами в config.
  Расчёты, приоритеты и финансовые пороги сохранены.
- PATCH действия возвращает полный шаг; household isolation, strict boolean,
  неизвестный ключ 404, закрытый шаг/конфликт 409. Compare-and-swap защищает
  отметки от потерянного обновления. Повтор запроса идемпотентен.
- Прогресс хранится в существующем JSON шага. Последнее действие завершает шаг;
  ручное завершение и откладывание сохраняют частичные отметки. Возврат полностью
  выполненного шага снимает последнюю отметку. Старые отчёты не пересчитываются.
- Изолированный Plan-компонент StepActions применяется к первому и остальным
  шагам: details, единственный счётчик, шкала, вертикальный список и чекбоксы.
  Сохранение, ошибка/повтор, черновик и offline; подтверждение только ответом API.
- `step_action_done` содержит только rule_key и key действия. Это необходимая
  часть P3-02, не завершение P3-09. Время чекапа ещё не добавлено.

## Проверки

| cwd | Команда | Результат |
|---|---|---|
| apps/plan-api | корневой `.venv/Scripts/python.exe -m pytest -q` | exit 0, 43 passed |
| apps/plan-web | `npm.cmd run test:unit` | exit 0, 8 passed |
| apps/plan-web | `npm.cmd run build` | exit 0 |
| apps/plan-web | `npm.cmd run test:e2e -- e2e/step-actions.spec.js e2e/checkup.spec.js` | exit 0, 22 passed, mobile-375/desktop |
| apps/plan-web | `npm.cmd run test:e2e -- e2e/step-actions.spec.js` после добавления offline/online | exit 0, 2 passed |
| frontend-react | `npm.cmd run design-lab:build-nav` | exit 0, 81 links |
| root | `.venv/Scripts/python.exe -X utf8 scripts/check_conventions.py` | exit 0, 6 principles |
| root | `git diff --check` по изменённым файлам среза | exit 0 |

Первый backend-прогон в sandbox завис в asyncio socketpair до API-запроса;
успешный прогон выполнен вне sandbox. Первый E2E выявил неверное ожидание
мгновенного checked и исчерпание лимита 20 входов/IP расширенным набором тестов.
Исправлены тестовое ожидание и отдельный SQLite E2E-сервер; лимиты приложения
не менялись. В unit-логе есть предупреждение Vite о занятом HMR-порте 24678,
8 проверок завершились успешно.

У Plan нет отдельного script `check:guardrails`; проверки Game/backend не запускались:
их продуктовая логика этим срезом не затронута. AI-конфигурация не менялась.
Это локальная реализация на синтетических данных, не деплой. Независимого
агентского ревью не было. Следующий срез очереди — P3-09; история и offline-кэш
отчёта остаются P3-08/P3-12.
