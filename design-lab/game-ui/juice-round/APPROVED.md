# Game UI — juice-round ★

**Дата:** 2026-05-26  
**Утверждено для prod:** **A** Gain · **C** Turn ritual · **D** Warning  
**Не в prod:** **B** Risk (backlog)

## Prod

| ID | Компонент / стили |
|----|-------------------|
| A | `MqxJuiceGainFeedback`, `mqx-juice-*` на дашборде / зарплата |
| C | `MqxPeriodCloseRitual` вместо `MqxPeriodCloseSheet` |
| D | `MqxSalaryWarnModal` перед закрытием месяца |

Витрина: `#/dev/mqx` → `MqxJuiceCatalogDemo`.


## Обновление C · 05.11.2026

Внешний вид ритуала итогов заменён утверждённым
[компактным A](../../period-close/clear-result-round/APPROVED.md).
Прежний C выше — история оформления; механизм показа и остальные juice
компоненты сохранены. Каталог MqxJuiceCatalogDemo показывает текущий A.
