# Архитектура GAME

Границы — [общая карта](../ARCHITECTURE.md). Web обращается к своему API.
HTTP-роутеры вызывают сценарии `api/app/services`; доменные правила находятся
в game, events, needs, victory, finance. ORM-модели и миграции принадлежат API.
Чистые расчёты — fincore; ORM → DTO адаптеры — `api/app/game/adapters`.

Frontend: api — транспортные адаптеры, hooks/context — координация,
screens/components — экраны и UI. MQX принадлежит GAME. Перенос каталогов
не означает завершённый внутренний рефакторинг этих слоёв.

CSS и ресурсы — `design/system`, карта экспортов — `design/asset-exports.json`.
Лендинг и web — отдельные потребители. Утверждения — design-lab.
[Документ потребностей](docs/architecture/architecture.md) описывает игровой домен,
а не общую архитектуру двух продуктов.
