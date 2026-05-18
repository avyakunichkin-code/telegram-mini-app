# Shell — карточки, заголовки, stat-mini

**Статус:** утверждён гибрид prod-паттернов → внедрено в `mqx/layout/` (без отдельного HTML-раунда: повторяет уже работающий дашборд).

## Компоненты MQX

| Компонент | Назначение |
|-----------|------------|
| `MqxCard` | Оболочка `mqx-card`, варианты `default` \| `goal` \| `character` |
| `MqxCardHeader` | Kicker + title + sub + trailing; `layout`: `stack` \| `split` |
| `MqxGoalBadge` | Бейдж «Победа / Почти / В работе» |
| `MqxBlockSection` | Секция с заголовком и ссылкой «Детали» |
| `MqxStatMini` | Плитка в сетке 2×2 (иконка + label + value) |
| `VictoryGoalItem` | Одна цель в списке победы |
| `VictoryGoalsPanel` | Собранная панель целей (использует shell) |

Живой каталог: `#/dev/mqx` → секция **Shell — карточка и блоки**.

## Не делаем (v1 shell)

- Hero / таймер (остаётся в `DashboardPremium` до спринта `dashboard/`)
- Empty / error states (следующий подслой shell)
- Отдельные Storybook-сторис
