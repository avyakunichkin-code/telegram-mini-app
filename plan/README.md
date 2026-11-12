# ТВОЙ ПЛАН

[Архитектура](ARCHITECTURE.md) · [Правила](AGENTS.md) · [Документы](docs/README.md).

- `web/` — React 18/Vite, `npm.cmd run dev` (:5190).
- `api/` — FastAPI, `uvicorn plan_api.main:app --reload --port 8020` из api.
- `landing/` — информационный сайт, независимый от API и web.
- `docs/` — specs, roadmap и исследования; `design-lab/` — варианты дизайна.

Работа только на вымышленных данных; перенос не разрешает продуктовый деплой.
Для разработки не требуется запускать GAME.

Python-окружение продукта — `plan/.venv`. Создать из plan: `py -3.14 -m venv .venv`;
затем из api: `../.venv/Scripts/python.exe -m pip install -r requirements.txt`.
Из web: `npm.cmd ci`. Runner и E2E предпочитают окружение продукта;
корневая `.venv` — переходный fallback. Реальные env и БД не входят в миграцию.
