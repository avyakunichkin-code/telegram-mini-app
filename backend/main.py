from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect, text

from app.database import engine, Base
from app.routers import auth_router, users_router, messages_router, health_router, finance_router, game_router


def ensure_schema_compatibility() -> None:
    """
    Лёгкая авто-миграция для уже созданных таблиц без Alembic.
    Нужна, чтобы деплой не падал при добавлении новых полей модели.
    """
    inspector = inspect(engine)
    if "game_profiles" not in inspector.get_table_names():
        return

    columns = {item["name"] for item in inspector.get_columns("game_profiles")}
    statements = []
    if "base_params_locked" not in columns:
        statements.append("ALTER TABLE game_profiles ADD COLUMN base_params_locked INTEGER NOT NULL DEFAULT 0")
    if "onboarding_state" not in columns:
        statements.append("ALTER TABLE game_profiles ADD COLUMN onboarding_state VARCHAR(30) NOT NULL DEFAULT 'draft'")

    if not statements:
        return

    with engine.begin() as connection:
        for stmt in statements:
            connection.execute(text(stmt))
    print(f"✅ Схема game_profiles обновлена: {len(statements)} изм.")


# Создаём/обновляем таблицы
Base.metadata.create_all(bind=engine)
ensure_schema_compatibility()
print("✅ Таблицы созданы/проверены")

app = FastAPI(title="Telegram Mini App API", version="2.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://avyakunichkin-code.github.io",
        "https://*.github.io",
        "http://localhost:3000",
        "http://localhost:8000",
        "http://127.0.0.1:5500",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Регистрируем роутеры
app.include_router(health_router)
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(messages_router)
app.include_router(finance_router)
app.include_router(game_router)


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