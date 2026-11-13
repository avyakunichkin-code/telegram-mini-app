# Отбор frontend-справок

Самодостаточный отбор для текущего React/Vite frontend. Историческое происхождение сохранено в source-ledger; читать исходные гайды старого контура не требуется. Runtime-версии сверять с game/web/package.json и lock; типы React не меняют версию runtime.

| Источник | Взять для React 18/Vite | Исключить / проверить перед применением |
|---|---|---|
| accessibility | native button, labels/alt, keyboard/focus, contrast, state beyond colour, reduced motion | проектный Basic tier и touch 44px; generic WCAG AA 24px не ослабляет проект; не устанавливать глобальный axe автоматически |
| composition-patterns + AGENTS.md | compound/context, явные варианты, state/actions/meta, осмысленное lifting | React 19 ref-as-prop и use() не использовать в React 18; forwardRef/useContext допустимы |
| react-best-practices + AGENTS.md | независимые fetch параллельно, lazy import, stable deps/derived state/handlers, измеряемые rerender/bundle улучшения | Next dynamic/RSC/server actions/cache/after/streaming, Activity/useEffectEvent и React DOM новые API не универсальны; SWR не обязательный dependency |
| frontend-design | варианты с реальными данными/чёткой композицией внутри бренда | не заменять утверждённый MQX произвольной палитрой/шрифтами; старые system-font и v7 детали сверять с текущим board-game каноном; lab и human approval обязательны |
| vite | ESM/config/assets/HMR, текущая manifest-команда build | справка основана на Vite 8 beta, её migrations/options проверять по lock/current docs; не переводить JS→TS или SPA→SSR без задачи |

При необходимости уточнять выбранную проблему по текущей официальной документации React/Vite; старые upstream-копии не читать. mqx-design определяет approval, frontend-implementation — исполнение. Состояния: loading/empty/error/disabled; русский/MoneyText, src/api domain и hooks, legacy quarantine — действующие локальные требования.

React 18 использует forwardRef/useContext; советы React 19 применять только после отдельной миграции runtime. Чтение или вывод env/секретов не требуется для frontend-задачи.
