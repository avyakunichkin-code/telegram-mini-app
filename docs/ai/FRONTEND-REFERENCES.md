# Отбор frontend-справок

Источник: frontend-react/.claude/skills, пять SKILL.md и slim AGENTS composition/react прочитаны; каталоги rules/references перечислены, применимые разделы AGENTS.full/rules проверяются по задаче. Исходники не изменены. Сверка происхождения — protected-before и source ledger. React ^18.2.0, Vite ^8.0.10 из package.json; @types/react 19 не обновляет React runtime.

| Источник | Взять для React 18/Vite | Исключить / проверить перед применением |
|---|---|---|
| accessibility | native button, labels/alt, keyboard/focus, contrast, state beyond colour, reduced motion | проектный Basic tier и touch 44px; generic WCAG AA 24px не ослабляет проект; не устанавливать глобальный axe автоматически |
| composition-patterns + AGENTS.md | compound/context, явные варианты, state/actions/meta, осмысленное lifting | React 19 ref-as-prop и use() не использовать в React 18; forwardRef/useContext допустимы |
| react-best-practices + AGENTS.md | независимые fetch параллельно, lazy import, stable deps/derived state/handlers, измеряемые rerender/bundle улучшения | Next dynamic/RSC/server actions/cache/after/streaming, Activity/useEffectEvent и React DOM новые API не универсальны; SWR не обязательный dependency |
| frontend-design | варианты с реальными данными/чёткой композицией внутри бренда | не заменять утверждённый MQX произвольной палитрой/шрифтами; старые system-font и v7 детали сверять с текущим board-game каноном; lab и human approval обязательны |
| vite | ESM/config/assets/HMR, текущая manifest-команда build | справка основана на Vite 8 beta, её migrations/options проверять по lock/current docs; не переводить JS→TS или SPA→SSR без задачи |

Читать полный upstream гайд только для выбранной проблемы, не все 70 правил на каждый JSX. mqx-design определяет approval, frontend-implementation — исполнение. Состояния: loading/empty/error/disabled; русский/MoneyText, src/api domain и hooks, legacy quarantine — действующие локальные требования.

Дополнительно полностью прочитаны composition rules/react19-no-forwardref и vite references/core-config, rolldown-migration; AGENTS.full оглавления/вводные просмотрены выборочно. Не переносить loadEnv с пустым prefix как разрешение читать/выводить секреты или бездумно expose переменные в frontend.
