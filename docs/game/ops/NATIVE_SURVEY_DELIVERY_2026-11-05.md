---
layer: audit
status: active
last_reviewed: 2026-11-05
---
# Нативный опрос · локальная поставка 05.11.2026

Реализован выбранный владельцем гибрид H: одно окно, три шага по 2 + 2 + 1
вопросу и необязательный свободный отзыв до 1000 символов. Ответы и текст
сохраняются при переходе назад и ошибке отправки. Обычные шаги не требуют
внутренней прокрутки на проверенных размерах. При экранной клавиатуре или
увеличении шрифта доступная прокрутка предпочтительнее обрезания формы.

Пять фактических закрытий открывают возможность приглашения. Оно ждёт
закрытия итогов, событий, guidance и других окон. «Позже» сохраняется на
аккаунте для этой версии; меню партии и меню сохранений остаются доступны,
включая проигранную партию. Отправленный ответ неизменяемый и единственный
на аккаунт/версию. Watchtower → «Опрос» показывает пять ответов и свободный
отзыв отдельно от финальных отзывов. Личные данные не запрашиваются;
анонимность не обещается, ответ связан с аккаунтом.

Выбор человека: [APPROVED](../../../design-lab/playtest-survey/APPROVED.md).
[Spec и API](../specs/features/SPEC_native-playtest-survey.md),
[интерактивный lab](../../../design-lab/playtest-survey/native-round/README.md).

## Изменения

- ORM + DDL `0051_player_playtest_surveys.sql`; baseline не менялся.
- GET/POST/dismiss `/api/game/playtest-survey`, состояние в bootstrap;
  admin GET `/api/admin/playtest-surveys` с require_admin_user.
- Ownership, строгие пять ключей, 1000 символов после trim, server-side
  template/period/closed-turn snapshot, UNIQUE и блокировка пользователя.
- MQX, каталог, API/hook, GameScreen, MenuPremium и StartMenuScreen.
- AdminPlaytestSurveys + вкладка и sidebar Watchtower.
- Канонический CSS master и manifest export, lab и навигатор.

## Проверки

Корень: `C:/Users/Aleksei Iakunichkin/IdeaProjects/telegram-mini-app`.
Python 3.13.0, Node 24.15.0, системный Chrome, отдельные SQLite/PostgreSQL.
Полные логи — `.codex-state/native-survey-*`; реальные анкеты/credentials
не читались. Экономические правила, baseline баланса и контент не менялись.

| cwd | Проверка | Exit | Результат |
|---|---|---:|---|
| backend | `../.venv/Scripts/python.exe -m pytest -q` | 0 | 689 passed, включая fincore/platform; `native-survey-backend-full.log` |
| backend | pytest `tests/integration/api/test_playtest_survey.py tests/test_schema_canon.py` | 0 | 19 passed на финальном API; `native-survey-backend-targeted.log` |
| frontend-react | `npm.cmd run test:unit` | 0 | Все группы, включая validation/gating нового опроса |
| frontend-react | `npm.cmd run build` | 0 | SPA + SW; известные предупреждения chunk/dynamic import/Browserslist остаются |
| frontend-react | `npm.cmd run check:guardrails` | 0 | Boundaries, canon, style, ratchet, 43 lab rounds |
| frontend-react | `npm.cmd run test:e2e -- e2e/playtest-survey.spec.js --output=test-results/native-survey-final` | 0 | 10 passed, mobile/desktop; `native-survey-e2e-final.log` |
| lab/native-round | `node verify.mjs` | 0 | 54 комбинации трёх шагов/form/sending/error, light/dark, 360×640/390×744/desktop |
| root | PostgreSQL 18 baseline + все increments + повтор 0051 | 0 | Новая отдельная БД на 127.0.0.1:55457; `native-survey-pg-migrate.log` |
| backend | PostgreSQL schema parity + concurrent service checks | 0 | identical submit → один ID; dismiss/submit → submitted; разные submit → 200/409; `native-survey-pg-check.log` |

Финальные FE-коды сохранены в `native-survey-final-exits.txt`:
`UNIT=0 BUILD=0 GUARDRAILS=0`. E2E используют PYTHON_DOTENV_DISABLED=1,
корневую .venv, порты 8029/5199 и временную SQLite с синтетическими аккаунтами.
В PostgreSQL использован новый initdb в `.codex-state`, без доступа к существующим
БД; после проверки сервер не работает (`pg_ctl status`: no server running).

Runtime E2E проверяют на каждом шаге и при ошибке реальные размеры окна в
light/dark на 360×640, 390×744 и 1440×950, возврат с отзывом, 503/retry,
серверное подтверждение, Позже/reload/фокус, foreground-resync и Watchtower.
Подсчёт пяти закрытий проверяется backend-тестом; UI-приглашение в E2E использует
синтетическую eligibility. Сценарий foreground events закрывает два реальных
хода API; UI-финал и Watchtower table используют синтетические payload.
Авторизация admin отдельно доказана 403/positive backend-тестами.

Независимый mqx-ui-reviewer: **PASS** после исправлений. Два первоначальных
замечания (вход после поражения и события поверх опроса) устранены и покрыты E2E.
Это независимый UI-проход, не человеческое approval и не экономический review.
Первый запуск нового E2E падал на ошибочном локаторе button вместо role=tab
у меню; тест исправлен и финальный прогон прошёл. Обходов auth/гейтов нет.

## Граница готовности

Код готов локально. Merge, commit, push, production migrate/deploy и волна
участников не выполнены. До выкладки применить 0051 на выбранном целевом
PostgreSQL, затем backend/frontend одной версии. SQLite create_all не заменяет
production migration. Провести smoke синтетическим аккаунтом и проверить
появление ответа в Watchtower перед приглашениями.

Реальные iOS/Android клавиатура, системное увеличение шрифта и screen reader
не проверены вручную. Детерминированный balance suite заново не запускался:
изменены анкета, API и UI, финансовые формулы/данные не затронуты.
Существующие незакоммиченные изменения пользователя сохранены.
