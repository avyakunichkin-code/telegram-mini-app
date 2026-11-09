# Полный проход MQX · 2026-11-04

Поручение владельца: все элементы каталога под текущую дизайн-систему,
в частности прежняя «Форма депозита (variant D)».

Область: 29 секций `#/dev/mqx`, список заголовков — в `verification.json`.
Финансовые компоненты показаны в статичном нативном контексте окна капитала.
Используются production-правила `.mqx-sheet` для формы, ставки, ползунка,
тарифов и шаблонов; отдельно показанные legacy-примитивы получают адаптер
`.mqx-catalog` в каноническом `design/system/runtime/styles/mqx/ink.css`.
Production-потоки не перекомпонованы, экономика/API не менялись.

Исправлено: повтор ставки депозита; декоративные прежние кнопки/вкладки;
неподвижный выбор жизни; светлые подложки финансовых строк в dark;
текст онбординга на фиолетовом фоне; горизонтальная обрезка контейнера;
невидимая абсолютная подсказка метрики, расширявшая секцию. `title` и
`aria-label` метрик сохраняются. Убраны пустые места закрытого ритуала/итогов.

Browser/system Chrome: из root `node frontend-react/scripts/check-mqx-catalog-all.mjs`.
29 секций × 1440/390 × light/dark; проверены реальные границы каждой секции,
загрузка изображений, отсутствие JS/HTTP ошибок и переполнения.
Депозит: одна ставка, ввод/нулевая сумма/отправка, чернильная рамка 2 px,
отсутствие градиента кнопки и наличие тени. Скриншоты: `width-theme-NN.png`;
контактные листы — `overview-light.jpg`, `overview-dark.jpg`.

Регрессия действий: `node frontend-react/scripts/check-current-mqx-browser.mjs`
— exit 0, сегменты, зарплата/сброс и confirm/отмена/удаление/покупка.
Из frontend-react: `npm.cmd run test:unit`, `npm.cmd run build`,
`npm.cmd run check:guardrails` — exit 0. Из root:
`node scripts/design-assets.mjs --check`, scoped `git diff --check` — exit 0.

Self-review не является независимым review или новым человеческим approval.
Backend/balance checks N/A. Сборка сохраняет прежние предупреждения о chunk
>600 kB, ineffective dynamic import api.js и устаревшем Browserslist.
