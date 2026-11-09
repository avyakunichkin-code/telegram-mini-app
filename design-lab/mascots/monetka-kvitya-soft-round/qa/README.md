# Проверка lab · Монетка и Квитя · 03.11.2026

Основа A утверждена пользователем. Новые эмоции/позы и обновлённый блок 02 — на просмотре.

| cwd | Команда | Результат |
|---|---|---|
| root | `node design-lab/mascots/monetka-kvitya-soft-round/render-references.mjs` | exit 0 |
| root | `.venv/Scripts/python.exe design-lab/mascots/monetka-kvitya-soft-round/prepare-art.py` | exit 0 |
| round | Git Bash `./sync-lab.sh` | exit 0, базовый CSS и шрифты сгенерированы |
| frontend-react | `npm.cmd run design-lab:build-nav` | exit 0, 74 ссылки |
| frontend-react | `npm.cmd run design-lab:check-rounds` | exit 0, 39 раундов |
| root | `node design-lab/mascots/monetka-kvitya-soft-round/check-round.mjs` | exit 0 |
| root | `node --check design-lab/mascots/monetka-kvitya-soft-round/round.js` | exit 0 |
| root | `git diff --check -- design-lab/nav.manifest.json design-lab/index.html design-lab/mascots/monetka-kvitya-soft-round` | exit 0 |

Browser QA — system Chrome/Playwright, localhost:4175. 6 сочетаний
1440/768/390 px × light/dark на основе A. В каждом проверены восемь ситуаций Монетки,
три состояния Квити и нативные подписи
на ободе, нижняя подпись «★ ТВОЙ ХОД ★», загрузка изображений, итог +10 700 ₽,
отсутствие горизонтального overflow, JS и HTTP errors. JSON: `verification.json`.
Скриншоты сравнения и светлого/тёмного контекста просмотрены при self-review.

Графика создана built-in imagegen с исходными SVG-рендерами и семейством B.
Первые ревизии сохранены; повторные imagegen-редакции очищают края. Прозрачность
оценивалась по реальным браузерным композитам на светлом и тёмном фоне.
Обработка только извлекает/масштабирует пиксели и делает форматные обрезки:
маленький аватар лица и верхняя бумажная часть Квити. Золотая рамка аватара,
подписи, строки и суммы — нативный интерфейс, не запечённая графика.

Подготовлены семь уникальных поз Монетки (приветствие используется дважды)
и три состояния Квити. Статичные состояния не являются анимационным atlas.
Обновлённая проверка раундов: 40 sync-lab dirs, exit 0.
Обработка новых состояний `prepare-emotions.py`: exit 0.
Снимок набора: `emotions-desktop.png`; блок 02: `contexts-a-*-*.png`.
Перенос в MQX/React с canon sync — после утверждения новых состояний.
Этот lab не объявляет новые production-состояния.
Самопроверка не является независимым review или человеческим approval.
Продукт, экономика, backend и лендинг этим раундом не менялись;
соответствующие product suites N/A. Публикация не выполнялась.
