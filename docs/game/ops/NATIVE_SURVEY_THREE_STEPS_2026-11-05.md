---
layer: audit
status: active
last_reviewed: 2026-11-05
---
# Нативный опрос · три экрана

Владелец уточнил, что дополнительные вопросы должны оставаться на трёх
экранах. Обновлённый lab утверждён ответом «Отлично» после предложения
перенести группировку в приложение после утверждения макета.
[Запись выбора](../../../design-lab/playtest-survey/APPROVED.md).

MQX теперь использует 4 + 3 + 2 вопроса: деньги/подушка, завершение хода,
впечатления. Свободный текст находится на третьем экране. Ответы и текст
сохраняются при возврате и сетевой ошибке; отправка проверяет все девять.
Версия `first_turns_v2`, API, схема данных и исторические ответы не менялись.

Компактнее отступы, а не области нажатия: ответы сохраняют минимум 44 px.
Сложность занимает три равные колонки с нативными radio, выделением выбора
и фокусом на подписи. Canon CSS и runtime-копия одинаковы.

## Проверки

Root: `C:/Users/Aleksei Iakunichkin/IdeaProjects/telegram-mini-app`.
Node 24.15.0, Chrome; изолированный E2E backend на SQLite, синтетические данные.
Логи `.codex-state/native-survey-three-*`.

| cwd | Команда | Exit | Результат |
|---|---|---:|---|
| frontend-react | `npm.cmd run test:unit` | 0 | Пройдены |
| frontend-react | `npm.cmd run build` | 0 | Собран |
| frontend-react | `npm.cmd run check:guardrails` | 0 | Пройдены; существующее предупреждение Plan lab вне опроса |
| design-lab/playtest-survey/native-round | `node verify.mjs` | 0 | 30 проверок, три шага и sending/error, light/dark, 360×640/390×744/desktop |
| frontend-react | `npm.cmd run test:e2e -- e2e/playtest-survey.spec.js --output=test-results/native-survey-three-final` | 0 | 10 passed: mobile/desktop, все шаги, ошибка/повтор, Позже, события/финал, Watchtower |
| root | Сверка lab/runtime групп, локальных ссылок и scoped `git diff --check` | 0 | Расхождений и ошибок нет |
| root | `.venv/Scripts/python.exe -X utf8 scripts/check_conventions.py` | 0 | 6 principles, conventions gate passed |

Первый runtime-прогон подтвердил прохождение всех трёх экранов на mobile
и desktop, но вспомогательные тесты ещё ожидали текст «Шаг 1 из 5».
Ожидания исправлены на «Шаг 1 из 3»; проверка размещения не ослаблялась.

Независимый UI review `survey_ui_review`: PASS. Проверены группировка,
сохранение ответов/текста, клавиатурное управление и фокус, canon/runtime,
человеческое утверждение и итоговые проверки; воспроизводимых регрессий нет.

Backend/SQL/экономика не менялись: полный pytest и PostgreSQL-проверки
повторно не запускались. Для v2 ранее пройдены 696 backend-тестов:
[предыдущий отчёт](../../archive/retired/ops/NATIVE_SURVEY_V2_2026-11-05.md).
Реальная клавиатура телефона, screen reader и крупный системный шрифт
вручную не проверены; прокрутка для таких условий остаётся доступной.
Production не обновлялся.
