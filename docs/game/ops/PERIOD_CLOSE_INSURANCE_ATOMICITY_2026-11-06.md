---
layer: audit
status: draft
last_reviewed: 2026-11-06
---
# Истечение полиса внутри завершения хода

Следующий инженерный срез по поручению «Продолжай следующую задачу»:
проверка гипотезы атомарности из GAME roadmap и CODEX-INVARIANTS.

Воспроизведение подтвердило дефект: `expire_policies_for_period` делал
`db.commit()` внутри страхового savepoint завершения хода. Ошибка после
страховки оставляла уже списанные расходы и деактивацию полиса сохранёнными,
хотя ход не завершился. Регрессия до исправления: вместо10 000 ₽ осталось
8 999.99 ₽; проверка rollback упала, exit1.

Исправление: helper делает flush, транзакцией владеет вызывающий код.
Единственный продуктивный вызов helper — `post_premiums_for_period` внутри
`process_period_end`; отдельного HTTP-вызова или самостоятельного scheduler нет.
При успехе истечение сохраняется с ходом; при сбое до итогового commit
откатываются и расходы, и истечение полиса. Действующий второй полис
по-прежнему списывает свою премию. Правила срока и расчёта премии не менялись.
Это не утверждение атомарности всех post-commit уведомлений и replay-ответа.

Проверки, cwd backend, Python3.13, dotenv disabled, временная SQLite:

- `../.venv/Scripts/python.exe -m pytest -q tests/test_period_close_overdue_and_insurance.py tests/test_insurance_policy_expiry.py tests/test_close_period_failure_and_replay.py tests/unit/game/test_period_close_golden.py`:
  **22passed,39.93s,exit0**.
- Полный `../.venv/Scripts/python.exe -u -m pytest -q`:
  **711passed,577.42s,exit0**; `.codex-state/insurance-atomicity-backend.log`,
  `insurance-atomicity-backend-exit.txt`. Запущен с доступом к локальным
  сокетам TestClient из-за ранее подтверждённого ограничения Windows sandbox.
- Root `.venv/Scripts/python.exe scripts/check_conventions.py`: exit0,
  6 principles; `git diff --check` по затронутым файлам: exit0.

Первый черновой тест премии был на месяце оформления, когда премия закономерно
нулевая; исправлен на следующий месяц. Его первоначальное падение не считается
доказательством бага. Доказательство до правки — независимый rollback-сценарий.
Frontend, схема, YAML, ставки, пороги победы и production этим срезом не менялись.
