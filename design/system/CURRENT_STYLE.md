# Актуальный стиль приложения: «Чернильный край»

Проверено 02.11.2026 по коду: стиль ★ (PO 2026-11-02) и единственный в prod — переключателя `?style=classic` и атрибута `data-mqx-style` больше нет.

Редактируемый runtime CSS находится в `design/system/runtime/`. Пути `frontend-react/src/index.css` и `frontend-react/src/styles/` ниже — его проверяемые экспорты, которые реально импортируются приложением. Прежняя выгрузка и PNG вынесены в `design/archive/classic-v3/`; новые персонажи — `illustrations/characters.js`, SVG-экспорты в `assets/Characters/` и `assets/Companions/`.

## Цепочка источников

1. `runtime/styles/tokens.css` — токены «Чернильного края»: `--mq-ink-w`, `--mq-ink-line`, `--mq-ink-drop`, `--mq-ink-off`, `--mq-ink-off-s` (в тёмной теме край и тень — `--mq-board-ink-faint`). Те же токены — в `tokens.json` дизайн-системы.
2. `runtime/styles/mqx/*.css` — правила стиля в CSS своего блока: `board.css` (Главная), `finance.css` (Капитал, листы и подтверждение — последним разделом файла), `events.css`, `juice.css` (итог хода), `analytics.css`, `pregame.css` (вкладка Меню), `run-finale.css`, `guidance.css` (подсказка онбординга), `shell.css` (таббар).
3. `design-lab/board-game/APPROVED.md` — инварианты стиля (обводка, цветная и чернильная тень, одна рамка на уровень) и история: выбранный A, карта хода K1, окна `ink-sheets-round`, доработка и ★ по `ink-decision-round`.
4. В этой дизайн-системе — `components/InkEdge/README.md`, `preview.html`, классы `.th-ink` в `components/bundle.css`: те же правила на примерах `th-*`.

До 2026-11-02 стиль был пробным слоем `styles/mqx/ink.css` под `:root[data-mqx-style='ink']` с переключателем `utils/mqxStyle.js`; слой влит в CSS блоков, переключатель удалён.

## Превью и лендинг

`ink-preview.html` показывает пример InkEdge. Адаптер `components/InkEdge/examples.css` применяет правила к трём базовым примерам; переменные `--mq-ink-*` берутся из `tokens.css`, отдельный `runtime-ink.css` больше не экспортируется. Образцы по-прежнему помечены как примеры системы, не скриншоты production.
