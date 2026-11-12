# ТВОЙ ПЛАН

[Архитектура](ARCHITECTURE.md) · [Правила](AGENTS.md) · [Документы](docs/README.md).

- `web/` — React 18/Vite, `npm.cmd run dev` (:5190).
- `api/` — FastAPI, `uvicorn plan_api.main:create_app --factory --reload --port 8020` из api.
- `landing/` — информационный сайт, независимый от API и web.
- `docs/` — specs, roadmap и исследования; `design-lab/` — варианты дизайна.

Работа только на вымышленных данных; перенос не разрешает продуктовый деплой.
Для разработки не требуется запускать GAME.

Python-окружение продукта — `plan/.venv`. Создать из plan: `py -3.14 -m venv .venv`;
затем из api: `../.venv/Scripts/python.exe -m pip install -r requirements.txt`.
Из web: `npm.cmd ci`. Runner и E2E используют только среду продукта;
явный другой Python: `PROJECT_PYTHON` / `E2E_PYTHON`. Реальные env и БД не входят в миграцию.

Из корня продукта: `npm.cmd run dev:api` и в другом терминале `npm.cmd run dev`.
`npm.cmd run smoke` проверяет API, HTML и прокси на временной SQLite без dotenv;
по завершении останавливает свои процессы. Порты dev можно переопределить
через `PROJECT_API_PORT` / `PROJECT_WEB_PORT`; адрес API во фронтенде — отдельно.
