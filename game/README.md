# ТВОЙ ХОД

[Архитектура](ARCHITECTURE.md) · [Правила](AGENTS.md) · [Документы](docs/README.md).

- `web/` — React 18/Vite, `npm.cmd run dev` (:5173).
- `api/` — FastAPI, `uvicorn main:app --reload --port 8000` из api.
- `landing/` — отдельная сборка: `npm.cmd run build` из landing.
- `design/` — исходники, `design-lab/` — варианты и утверждения.
- `data/` — контент, `docs/` — продуктовые решения и планы.

Окружение — [LOCAL_DEV](docs/ops/LOCAL_DEV.md). Общие библиотеки находятся
в `../shared/packages`; соседний продукт запускать не требуется.

Python-окружение продукта — `game/.venv`. Создать из game: `py -3.14 -m venv .venv`;
затем из api: `../.venv/Scripts/python.exe -m pip install -r requirements-dev.txt`.
Из web: `npm.cmd ci`. Runner и E2E используют только среду продукта;
явный другой Python: `PROJECT_PYTHON` / `E2E_PYTHON`.
Локальные env и БД из прежних каталогов автоматически не переносились и не читались.

Из корня продукта: `npm.cmd run dev:api` и в другом терминале `npm.cmd run dev`.
`npm.cmd run smoke` проверяет API, HTML и прокси на временной SQLite без dotenv;
по завершении останавливает свои процессы. Порты dev можно переопределить
через `PROJECT_API_PORT` / `PROJECT_WEB_PORT`; адрес API во фронтенде — отдельно.
