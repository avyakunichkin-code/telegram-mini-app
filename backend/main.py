from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.gzip import GZipMiddleware
from sqlalchemy import inspect
from sqlalchemy.engine import make_url

from app.cors_settings import resolve_cors_allow_origin_regex, resolve_cors_allow_origins
from app.database import engine
from app.db_schema import prepare_schema
from app.routers import (
    auth_router,
    users_router,
    health_router,
    finance_router,
    game_router,
    period_router,
    events_router,
    invest_router,
    insurance_router,
    achievements_router,
    expenses_router,
    admin_router,
    needs_router,
    telegram_router,
)



def _validate_database_url() -> None:
    """
    Fail fast with a clear message when DATABASE_URL is malformed.
    Render frequently shows a "Hostname" like dpg-...-a, but DATABASE_URL must
    contain a resolvable host (usually a full *.render.com or regional internal host).
    """
    try:
        url = make_url(str(engine.url))
    except Exception:
        # If SQLAlchemy can't parse it, the startup will fail anyway.
        return

    host = (url.host or "").strip()
    # Render can provide an Internal Database URL whose host is only resolvable inside Render's network.
    # That host may look like "dpg-...-a" without dots. This is valid on Render, but invalid locally.
    #
    # Therefore: do NOT hard-fail here. Emit a warning with actionable guidance.
    if host.startswith("dpg-") and "." not in host:
        print(
            "[warn] DATABASE_URL host выглядит как 'dpg-...-a' без домена. "
            "Это нормально для Render Internal Database URL (резолвится только внутри Render). "
            "Локально такой host не резолвится — для локального запуска используй External Database URL.",
            flush=True,
        )


def _lint_victory_goals() -> None:
    """Не блокирует старт: каталог victory_goals с ошибками — только лог."""
    inspector = inspect(engine)
    if "victory_goals" in inspector.get_table_names():
        from app.database import SessionLocal
        from app.victory.goals_lint import lint_victory_goals

        db = SessionLocal()
        try:
            issues = lint_victory_goals(db)
            for i in issues:
                print(f"[victory_goals][{i.severity}] template={i.template_key} goal={i.goal_key or '-'}: {i.message}")
        finally:
            db.close()


@asynccontextmanager
async def _lifespan(_app: FastAPI):
    _startup_db_bootstrap()
    yield


app = FastAPI(title="Telegram Mini App API", version="2.0.0", lifespan=_lifespan)

app.add_middleware(GZipMiddleware, minimum_size=500)

# CORS — origins и regex из env (см. backend/.env.example, docs/ops/DEPLOY.md)
_cors_kw: dict = {
    "allow_origins": resolve_cors_allow_origins(),
    "allow_credentials": True,
    "allow_methods": ["*"],
    "allow_headers": ["*"],
}
_cors_regex = resolve_cors_allow_origin_regex()
if _cors_regex:
    _cors_kw["allow_origin_regex"] = _cors_regex

app.add_middleware(CORSMiddleware, **_cors_kw)

# Регистрируем роутеры
app.include_router(health_router)
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(finance_router)
app.include_router(game_router)
app.include_router(period_router)
app.include_router(events_router)
app.include_router(invest_router)
app.include_router(insurance_router)
app.include_router(achievements_router)
app.include_router(expenses_router)
app.include_router(admin_router)
app.include_router(needs_router)
app.include_router(telegram_router)

def _startup_db_bootstrap() -> None:
    _validate_database_url()

    # PR-08: схема — только `db.sh migrate`; PostgreSQL здесь лишь сверяется с ORM,
    # SQLite (e2e, sim) поднимается create_all. См. app/db_schema.py.
    prepare_schema(engine)

    from app.database import SessionLocal

    _db_boot = SessionLocal()
    try:
        # Reference data + catalogs (idempotent).
        from app.seeds.runner import seed_all

        seed_all(_db_boot)
        _db_boot.commit()
    except Exception:
        _db_boot.rollback()
        raise
    finally:
        _db_boot.close()

    _lint_victory_goals()
    print("[OK] Схема проверена, сиды применены")


@app.get("/")
async def root():
    return {
        "message": "Telegram Mini App API",
        "version": "2.0.0",
        "status": "running"
    }


if __name__ == "__main__":
    import uvicorn
    print("🚀 Запуск Telegram Mini App Backend...")
    uvicorn.run("main:app", host="0.0.0.0", port=10000, reload=True)