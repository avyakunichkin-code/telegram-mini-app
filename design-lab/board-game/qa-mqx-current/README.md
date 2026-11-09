# MQX: актуальные четыре секции · 2026-11-03

По поручению владельца исправлены именно примеры, а не только заголовки.
Источник — `frontend-react/src/components/mqx/catalog/MqxCurrentCatalogDemos.jsx`.
Канон: BG-3, BG-4 и список A в окнах капитала, не review-варианты refinement.

- Примитивы: нет прежнего градиентного hero; используются существующие кнопки,
  прогресс и тег. Состояния показывают локальный результат.
- Действия: настоящая оболочка MqxCapitalSheet, текстовые Купить/Удалить,
  confirm, отмена, удаление и повторная покупка.
- Сегменты: рабочие «Детали / Действия» и «Добавить / Мои» с выбранным содержимым.
- Дашборд: актуальные компоненты, единое состояние зарплаты, изменение суммы
  после выплаты, сброс. Условные данные, без вызовов игрового API.

Из frontend-react: `npm.cmd run test:unit`, `npm.cmd run build`,
`npm.cmd run check:guardrails` — exit 0. Из root: `node scripts/design-assets.mjs --check`
и scoped `git diff --check` — exit 0.
Browser: `node frontend-react/scripts/check-current-mqx-browser.mjs` — exit 0;
1440/390 × light/dark, четыре секции, вкладки, выплата/сброс, отмена/удаление/покупка,
нет JS errors и горизонтального overflow. Результат `verification.json`.
Снимки четырёх секций просмотрены. Self-review не является независимым review.

Product layout и финансовая логика не менялись; backend/balance checks N/A.
В FE build остаются прежние предупреждения chunk >600 kB, ineffective dynamic
import api.js и устаревшего Browserslist. Новых библиотек нет.
