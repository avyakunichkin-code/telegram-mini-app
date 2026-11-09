# ТВОЙ ПЛАН — первый срез базы, 2026-11-04

Согласованный объём: ButtonBase для двух продуктов, композиция выбранных блоков
отчёта в lab, проверка сложных финансовых случаев. Исходные изменения рабочего
дерева сохранены. Это отчёт выполнения и проверок, не новое продуктовое решение.

## Реализовано

- `packages/ui-kit`: ButtonBase с native type, ref, disabled/busy и aria-busy.
  Plan Button и Game MqxButton используют его с существующими классами и темами.
  В Plan исправлено перекрытие busy через `disabled={false}`. Тип по умолчанию —
  button; существующие формы уже передают submit явно.
- Vite обоих приложений разрешает пакет из исходников и дедуплицирует React.
  Корневой workspace не создавался: сохранён подход текущего api-client.
- Plan unit проверяет оба адаптера; CI job plan запускает эти проверки.
  Browser fixture проверяет фокус через ref, Enter/Space, submit и busy lock.
- Lab direction-round: вкладка «Отчёт целиком» сохраняет четыре области C2,
  затем F2, A2/S1, остаток/точность и подробности с M1. Исходники выбранных
  блоков общие с лабораторией вариантов. Добавлены неразрывные суммы в тексте.
- Четыре проверки анализа: нули без NaN/Infinity и ложного свободного остатка;
  нерегулярный доход диапазоном 40–140 тыс. при расходах 80 тыс. и резерве 100 тыс.
  (пессимистичный минус в месяце 3); сохранение второго дохода при потере первого;
  приоритет сокращения дефицита при пустом резерве. Все прошли без правки расчётов.

## Проверки

Windows PowerShell, Node/Vite, Python 3.13 из корневой `.venv`, системный Chrome.
Команды приведены относительно cwd; все завершённые проверки ниже — exit 0.

| cwd | Команда | Результат |
|---|---|---|
| apps/plan-web | `npm.cmd run test:unit` | 4 passed, реальные Plan и Game адаптеры |
| apps/plan-web | `npm.cmd run build` | bundle собран |
| frontend-react | `npm.cmd run test:unit` | все группы прошли: 27 + 48 + 1 + 21 + 1 |
| frontend-react | `npm.cmd run build` | bundle и PWA собраны |
| frontend-react | `npm.cmd run check:guardrails` | все проверки прошли |
| apps/plan-api | `& ../../.venv/Scripts/python.exe -m pytest -q tests/test_analysis.py` | 19 passed |
| apps/plan-api | `& ../../.venv/Scripts/python.exe -m pytest -q` | 39 passed |
| apps/plan-web | `node node_modules/@playwright/test/cli.js test --reporter=list` | 12 passed, mobile-375 и desktop |
| apps/plan-web | `node scripts/check-report-lab.mjs` | 105 сочетаний, объяснение A2 и отметка S1 |
| root | `node --check design-lab/plan-checkup/direction-round/blocks.js` | синтаксис корректен |
| root | `& .venv/Scripts/python.exe -X utf8 scripts/check_conventions.py` | 6 principles, passed |
| root | `git diff --check -- <пути среза>` | whitespace ошибок нет |

E2E использовал E2E_PYTHON (абсолютный путь корневой .venv), порты 8035/5205,
временную SQLite. Первый sandbox API/E2E запуск завис при создании локального
стенда и остановлен; успешные полный pytest и Chrome выполнялись с разрешённым
выходом из sandbox. Первый unit-запуск выявил ошибку тестового harness при прямой
SSR-загрузке CommonJS React; harness исправлен на обычный Node import. Это не
продуктовый RED. Нельзя считать исходный дефект busy воспроизведённым падающим
тестом до исправления: регрессия добавлена после осмотра исходного порядка props.

Игровые логи — `.codex-state/logs/plan-20261104-{game-unit,game-build,guardrails}.log`.
Успешные API/E2E результаты — в выводе команды этой сессии. Скриншоты lab —
`apps/plan-web/test-results/report-lab/report-{375,768,1440}.png`.
Мобильный и desktop скриншоты просмотрены; после этого поправлены вкладки и суммы,
105 сочетаний повторно прошли. Проверены loading/empty/error/disabled/ready.

## Границы и следующий шаг

Новая композиция приложения — review: требуется явное утверждение человека перед
переносом в `Report.jsx` по DESIGN_WORKFLOW. Канон лендинга и выбранные блоки не
объявляются отменёнными. P2 целиком не закрыт; ButtonBase — минимальный первый
пакет, без универсальных Field/Error/Progress и общей палитры.

Расчётные правила, fincore, API-контракты и игровой backend не менялись; полный
игровой backend pytest и balance не запускались. Lab использует иллюстративный
прогноз, его суммы не выданы за результаты движка. Полный accessibility-аудит и
исследование с людьми не проводились. Реальные данные, письма, PostgreSQL и деплой
не затрагивались. Замечание build об устаревшей базе Browserslist осталось без
обновления зависимостей. Независимый агентный review не выполнялся.
