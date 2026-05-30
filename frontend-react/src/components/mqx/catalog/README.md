# MQX catalog — demo data

Мок-данные для **`#/dev/mqx`** (`MqCatalogScreen`). Компоненты витрины не хранят объекты inline — только импорт из `catalog*.js`.

| Файл | Назначение | Lab parity |
|------|------------|------------|
| `catalogVictoryDemo.js` | Victory v2 / legacy goal | — |
| `catalogEventsDemo.js` | L3 baseline (короткое ДТП) | layout-round |
| `catalogEventsTailsDemo.js` | E2/E5 длинные тексты | `events/tails-round/` + `npm run check:events-tails-parity` |
| `catalogStatesDemo.js` | Period close ritual / sheet | `ui-states-unified/`, `period-close/` |
| `catalogInsuranceDemo.js` | Полис и план страховки | — |

**Правило:** новый блок витрины → новый `catalogFooDemo.js` или расширение существующего; при связи с design-lab — обновить APPROVED и parity-check.
