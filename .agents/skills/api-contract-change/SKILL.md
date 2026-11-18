---
name: api-contract-change
description: Change API contracts and their consumers in the selected product, including schema, errors and a critical integration scenario.
---

# api-contract-change

Сначала выбери продукт по задаче и [профилю](../../../docs/engineering/CODEX-PROCESSES.md).
Читай его schemas, HTTP-вход, сценарий и web API-адаптер/экран потребителя.
Определи тип, nullability, default, ошибки/status, auth и обратную совместимость.
Обнови сервер и потребителя в одном срезе; проверь happy path, границу, JSON-контракт
и негатив прав доступа по риску. Формат ошибок и размещение файлов бери из кода
выбранного продукта. Изменение схемы → $db-migration; UI следует его дизайн-процессу.
Общий api-client меняется только при транспортной необходимости с проверкой
реальных потребителей. Итог — реализация, критичный сценарий и результаты команд,
а не только OpenAPI. Не импортировать приложение соседнего продукта.

Общие границы: [AGENTS.md](../../../AGENTS.md).
