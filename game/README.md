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
Из web: `npm.cmd ci`. Runner и E2E предпочитают окружение продукта;
корневая `.venv` поддерживается как переходный fallback.
Локальные env и БД из прежних каталогов автоматически не переносились и не читались.
