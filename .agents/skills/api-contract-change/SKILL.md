---
name: api-contract-change
description: Change backend/frontend API contracts together, including schema, errors, consumers and a critical integration scenario.
---

# api-contract-change

Пример: «добавь API-поле прогноза». Не primary: текст YAML или CSS.
Прочитай backend/app/README.md, текущие schemas/router/services и frontend-react/src/api/<domain>.js + hook/экран потребителя. Определи тип/nullability/default/error/status, обратную совместимость и auth; проверь finance overview и guidance при их затрагивании. Тест: happy path, boundary, JSON контракт и негатив прав доступа по риску. Схема БД изменилась → $db-migration; новый layout → $mqx-design до prod. Заверши командой и результатом backend/FE проверок, не только OpenAPI-описанием.

Общие границы и готовность: [AGENTS.md](../../../AGENTS.md). Читай только источники затронутой области.
