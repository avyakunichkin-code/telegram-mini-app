# Перенос в игру и лендинг · 2026-11-03

Актуализация MQX по последнему поручению владельца: каталог различает серии
B/A, показывает 24/40/48/72 px Монетки и назначение поз; доступные состояния
отделены от фактически подключённых триггеров. README MQX, CURRENT_STYLE и
источники дизайн-системы приведены к тем же решениям; старые ссылки на навыки
в DESIGN_WORKFLOW заменены действующим маршрутом Codex.
Повторные `test:unit`, `build`, `check:guardrails` из frontend-react,
browser `check-soft-volume-browser.mjs` (1440/390 px) и scoped `git diff --check`
— exit 0. Новый продуктовый layout и игровые правила не вводились.

Человеческое поручение: «Давай, встраивай маскотов и монетку в игру и в лендинг».
Обе подписи с обода удалены. Основа A и семь/три состояния сохранены.

Проверки из root: обработка ассетов и `node scripts/design-assets.mjs` — exit 0,
181 зарегистрированный экспорт. Из frontend-react: `npm.cmd run test:unit`,
`npm.cmd run build`, `npm.cmd run check:guardrails` — exit 0.
Из landing: `npm.cmd run build` — exit 0.
Из root: `.venv/Scripts/python.exe -u -X utf8 scripts/check_conventions.py`
— exit 0, 6 principles; `git diff --check` по затронутым файлам — exit 0.

Browser/system Chrome: `node frontend-react/scripts/check-soft-volume-browser.mjs`
и `node landing/scripts/check-mascots.mjs` — exit 0. На 1440/390 px проверены
четыре пары, выбор персонажа, семь поз Монетки/три Квити, PNG fallback,
реальный компонент итогов хода с шестью строками, лендинг, все выборы и сброс.
В тесте лендинга добавлено ожидание видимого результата после клика.
JS/HTTP errors и горизонтального overflow нет. Только синтетические API fixtures.

Снимки React: `../../pet-style-round/qa/react/guides-*.png`, `kvitya-summary-*.png`.
Снимки лендинга: `../../../landing-refresh-20261030/qa-soft-volume/monetka-*.png`,
`kvitya-*.png`. Self-review не является независимым review.

Лендинг собран локально, публикация не выполнялась. Backend и экономика
не менялись, pytest и balance-playtest N/A. Сборка FE сохраняет предупреждения
о chunk >600 kB, ineffective dynamic import api и устаревшем Browserslist.
