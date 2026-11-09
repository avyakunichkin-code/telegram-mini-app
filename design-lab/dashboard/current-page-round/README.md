# Главная · текущий утверждённый вид · 04.11.2026

Каноническая витрина BG-3 E + BG-4 K1 и уточнений владельца 04.11.
Поручение в чате: «проверим и зафиксируем текущий вид во всём design-lab … в нашем mqx».
Решения: [dashboard/APPROVED](../APPROVED.md), [board-game/APPROVED](../../board-game/APPROVED.md).
04.11.2026 владелец подтвердил: «оставляем так, как есть сейчас». Раунд ink-refinement-round закрыт; A/B/C не выбраны и отправлены в архив. Этот раунд — действующий канон главной.

- Карта K1: контур и фиолетовая тень, внутренние кнопки без обводки.
- Четыре потребности: 6 px, без контура и чёрного ребра заполнения.
- Доходы / расходы / подушка: три колонки на поле, без рамок/подложек/теней.
- Цель на поле без внешнего контейнера; смысловые точки/финиш и фокус сохранены.
- Зарплата: золотая фишка без обводки, после выплаты — пунктир; ниже три залитых действия.
- Портреты B и Монетка A без надписей. Подушка — отдельный кошелёк.

HTML получен из реальных React-компонентов, CSS — из собранного frontend.
Данные синтетические; интерфейс не обращается к backend. Тема и состояния переключаются.
Снимок и provenance обновляются общим генератором `frontend-react/scripts/export-dashboard-reference.mjs`.

Пересборка из корня после FE build и запуска Vite :5176:
`node design-lab/dashboard/current-page-round/render-reference.mjs`, затем
Git Bash `design-lab/dashboard/current-page-round/sync-lab.sh`.
`lab-base.css` генерируется, руками не редактируется. `runtime.css`/`reference.js`
и assets/runtime — локальный снимок для автономного просмотра.

Из frontend-react: `npm.cmd run design-lab:build-dashboard-page-round` и
`npm.cmd run design-lab:build-nav` обновляют derived parity и хаб из manifest.
В MQX: раздел «Дашборд ★ BG-3 / BG-4», компонент `CurrentDashboardDemo`.
Проверка иерархии React: `frontend-react/scripts/check-current-mqx-browser.mjs`.
