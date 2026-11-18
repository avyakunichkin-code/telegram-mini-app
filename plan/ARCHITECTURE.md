# Архитектура PLAN

Границы — [общая карта](../ARCHITECTURE.md). React/Vite web использует свой API.
В `api/plan_api` находятся HTTP-вход, schemas, repo и анализ.
`analysis/adapter.py` переводит данные в DTO fincore. Календарное время
отображается в month_index. Инфраструктура — tvoy_platform; данные изолированы.

`web/src/api.js` — адаптер общего api-client; screens — экраны, App — координация.
Дальнейшее дробление App — отдельная задача. ui-kit даёт поведение примитивов,
стили и бренд принадлежат PLAN. Лендинг независим от web/API.
Ограничения выпуска — [ROADMAP](docs/ROADMAP.md) и ADR-017.
