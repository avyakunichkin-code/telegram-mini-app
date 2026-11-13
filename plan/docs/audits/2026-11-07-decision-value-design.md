# Пять улучшений ПЛАНА · подготовка к реализации

07.11.2026. Выполнен дизайн/spec срез по поручению «Давай сделаем это».
Это самопроверка, не независимое review и не approval человека.

## Результат

- SPEC_plan-five-improvements: контракт восстановления ввода, preview API,
  ограничения чувствительности и переводов, ожидание шага, когорта P3-10 и CS.
- decision-value-round: А «Рядом с решением», Б «Мастер проверки»; общие
  синтетические данные, интерактивные поля, навигация и состояния.
- PLAN_understanding-session: задания без подсказок, рубрика и агрегат отчёта.
- Раунд зарегистрирован в существующей секции атласа; хаб пересобран генератором.

Код приложения, API, fincore, БД и financial rules не менялись. Сохранение
несохранённых строк после reload ещё не реализовано. Лабораторная плашка
восстановления не является доказательством работы функции. Сценарий показывает
месячный поток на фиксированном примере, не прогноз из серверного расчёта.
Сессии исследования и серверный отчёт P3-10 не проведены/не реализованы.

## Проверки

| cwd | Команда | Результат |
|---|---|---|
| root | `node plan/design-lab/plan-checkup/decision-value-round/sync-lab.mjs` | exit 0; локальные шрифты и generated CSS |
| root | `node --check plan/design-lab/plan-checkup/decision-value-round/preview.js` | exit 0 |
| root | `node --check plan/design-lab/plan-checkup/decision-value-round/verify.mjs` | exit 0 |
| root | `node plan/design-lab/plan-checkup/decision-value-round/verify.mjs` | exit 0; Chrome, А/Б × 375/701/1050/1440 |
| frontend-react | `npm.cmd run design-lab:build-nav` | exit 0, хаб 105 ссылок |
| frontend-react | `npm.cmd run check:guardrails` | exit 0; три существующих предупреждения generated CSS actions/continuity/history |
| root | `git diff --check -- design-lab/nav.manifest.json design-lab/index.html` | exit 0; предупреждения LF/CRLF |

Браузерная проверка: нет overflow, JS/resource errors; переходы мастера,
невалидный/нулевой/превышающий остаток взнос, граница дохода, формулировка
отметки шага, loading/empty/error/offline, сохранение полей между состояниями.
Скриншоты и результат: plan/design-lab/plan-checkup/decision-value-round/qa/.
Desktop А просмотрен визуально. Screen reader, реальное устройство и приложение
не проверялись. Backend/FE production suites не запускались — diff только lab/docs.

Следующее решение: вариант А/Б и контракт первого среза сохранности. Рекомендуется
А. После выбора — реализация и критический E2E reload/session/conflict; затем
совместный API/FE preview. Прежние изменения рабочего дерева сохранены.
