---
layer: ops
status: active
tags:
  - tvoy-hod/layer/ops
  - tvoy-hod/status/active
aliases:
  - "Локальная разработка"
---
# Локальная разработка (Windows)

Прода сейчас нет (Render выключен, `render.yaml` — история). Вся разработка идёт локально: PostgreSQL 18 + backend на uvicorn + frontend на Vite. Будущий прод — свои серверы, контуры РФ и ЕС отдельно (контейнеры — отдельная задача).

## Версии

| Что | Версия | Почему |
|-----|--------|--------|
| Python | **3.14** | Версия проекта; на ней проходит весь pytest. Будущий Docker-образ — `python:3.14-slim` |
| PostgreSQL | **18** (подойдёт 16+) | Baseline — DDL из моделей SQLAlchemy, без привязки к версии. Будущий образ — `postgres:18`; на managed-БД не ниже 16 |
| Node.js | 20+ (проверено на 24) | Vite 5+ |

## Один раз: установка

1. **PostgreSQL 18** — установщик EDB с postgresql.org/download/windows. Запомни пароль пользователя `postgres`. Служба запускается сама. Если стоит не в `C:\Program Files\PostgreSQL`, перед запуском скрипта: `$env:PG_BIN = 'D:\...\PostgreSQL\18\bin'`.
2. **Python 3.14** — python.org (должен откликаться `py -3.14`).
3. Из корня репозитория:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\dev-setup.ps1
```

Скрипт идемпотентный, его можно запускать повторно. Политику выполнения он не меняет: `Bypass` действует только для этого процесса.

| Шаг | Что делает |
|-----|------------|
| Инструменты | Проверяет `py -3.14`, `psql` (если не в PATH — ищет в `C:\Program Files\PostgreSQL\*\bin`), Node |
| venv | `backend\.venv` на 3.14 + `requirements-dev.txt` |
| Env | Создаёт `backend\.env` (локальная БД, случайный `SECRET_KEY`) и `frontend-react\.env.local` (`VITE_API_BASE_URL=http://localhost:8000`, `VITE_BASE_PATH=/`). Существующие файлы не перезаписывает; если `backend\.env` смотрит не на localhost — останавливается |
| БД | Роль и база `tvoy_hod` / пароль `tvoy_hod` (спросит пароль `postgres` один раз) |
| Схема | `0000_schema_baseline.sql`, если схемы ещё нет, затем сиды `scripts/seed_db.py` (как `db.sh bootstrap`) |
| Frontend | `npm install` |

## Каждый день: запуск

Два окна PowerShell:

```powershell
cd backend; .\.venv\Scripts\python -m uvicorn main:app --reload --port 8000
```

```powershell
cd frontend-react; npm.cmd run dev
```

Приложение: http://localhost:5173/ — запросы `/api` Vite проксирует на `localhost:8000`. Swagger backend: http://localhost:8000/docs.

В Claude Code те же процессы запускаются из `.claude/launch.json` (`backend`, `frontend`, `design-lab`).

## Подводные камни Windows

| Симптом | Причина | Решение |
|---------|---------|---------|
| `Лексема "&&" не является допустимым разделителем` | Windows PowerShell 5.1 | Разделяй команды `;` |
| `npx.ps1 … выполнение сценариев отключено` | Политика выполнения | `npx.cmd …` / `npm.cmd …` |
| `python` открывает Microsoft Store | Заглушка Store | `py -3.14` или `.\.venv\Scripts\python` |
| Фронт видит чужие данные | `VITE_API_BASE_URL` в `.env.local` не на localhost | Поставь `http://localhost:8000` |

## Пересоздать базу с нуля

```powershell
$env:PGPASSWORD = Read-Host 'Пароль postgres'; psql -h localhost -U postgres -c "drop database tvoy_hod"; Remove-Item Env:PGPASSWORD
powershell -ExecutionPolicy Bypass -File scripts\dev-setup.ps1
```

## Тесты

Backend-тесты идут на SQLite, БД не нужна: `cd backend; .\.venv\Scripts\python -m pytest -q`. Frontend: `cd frontend-react; npm.cmd run test:unit`.
