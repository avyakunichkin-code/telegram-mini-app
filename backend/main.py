import json

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect, text

from app.database import engine, Base
from app.routers import auth_router, users_router, messages_router, health_router, finance_router, game_router, period_router, events_router, invest_router, insurance_router


def ensure_schema_compatibility() -> None:
    """
    Лёгкая авто-миграция для уже созданных таблиц без Alembic.
    Нужна, чтобы деплой не падал при добавлении новых полей модели.
    """
    inspector = inspect(engine)
    if "game_profiles" not in inspector.get_table_names():
        return

    statements = []

    # ---- game_profiles ----
    columns = {item["name"] for item in inspector.get_columns("game_profiles")}
    if "base_params_locked" not in columns:
        statements.append("ALTER TABLE game_profiles ADD COLUMN base_params_locked INTEGER NOT NULL DEFAULT 0")
    if "onboarding_state" not in columns:
        statements.append("ALTER TABLE game_profiles ADD COLUMN onboarding_state VARCHAR(30) NOT NULL DEFAULT 'draft'")
    if "clean_period_streak" not in columns:
        statements.append("ALTER TABLE game_profiles ADD COLUMN clean_period_streak INTEGER NOT NULL DEFAULT 0")

    # ---- finance_liabilities ----
    if "finance_liabilities" in inspector.get_table_names():
        liab_columns = {item["name"] for item in inspector.get_columns("finance_liabilities")}
        if "overdue_amount" not in liab_columns:
            statements.append("ALTER TABLE finance_liabilities ADD COLUMN overdue_amount FLOAT NOT NULL DEFAULT 0")
        if "overdue_periods" not in liab_columns:
            statements.append("ALTER TABLE finance_liabilities ADD COLUMN overdue_periods INTEGER NOT NULL DEFAULT 0")

    # ---- event_definitions (расширение без запуска 0003) ----
    if "event_definitions" in inspector.get_table_names():
        ed_cols = {item["name"] for item in inspector.get_columns("event_definitions")}
        if "mandatory" not in ed_cols:
            statements.append("ALTER TABLE event_definitions ADD COLUMN mandatory INTEGER NOT NULL DEFAULT 0")
        if "category" not in ed_cols:
            statements.append("ALTER TABLE event_definitions ADD COLUMN category VARCHAR(80)")
        if "metadata_json" not in ed_cols:
            statements.append(
                "ALTER TABLE event_definitions ADD COLUMN metadata_json TEXT NOT NULL DEFAULT '{}'"
            )

    # ---- finance_assets ----
    if "finance_assets" in inspector.get_table_names():
        asset_columns = {item["name"] for item in inspector.get_columns("finance_assets")}
        if "kind" not in asset_columns:
            statements.append("ALTER TABLE finance_assets ADD COLUMN kind VARCHAR(50) NOT NULL DEFAULT 'generic'")
        if "monthly_income" not in asset_columns:
            statements.append("ALTER TABLE finance_assets ADD COLUMN monthly_income FLOAT NOT NULL DEFAULT 0")

    # ---- game_profiles: save_kind + шаблон (ADR-001 / эпик G1) ----
    if "game_profiles" in inspector.get_table_names():
        gp_cols = {item["name"] for item in inspector.get_columns("game_profiles")}
        if "save_kind" not in gp_cols:
            statements.append(
                "ALTER TABLE game_profiles ADD COLUMN save_kind VARCHAR(16) NOT NULL DEFAULT 'game'"
            )
        if "starter_template_key" not in gp_cols:
            statements.append(
                "ALTER TABLE game_profiles ADD COLUMN starter_template_key VARCHAR(80)"
            )
        if "starter_params_json" not in gp_cols:
            statements.append(
                "ALTER TABLE game_profiles ADD COLUMN starter_params_json TEXT NOT NULL DEFAULT '{}'"
            )
        if "base_monthly_lifestyle_expense" not in gp_cols:
            statements.append(
                "ALTER TABLE game_profiles ADD COLUMN base_monthly_lifestyle_expense DOUBLE PRECISION NOT NULL DEFAULT 0"
            )
        if "delta_monthly_lifestyle_expense" not in gp_cols:
            statements.append(
                "ALTER TABLE game_profiles ADD COLUMN delta_monthly_lifestyle_expense DOUBLE PRECISION NOT NULL DEFAULT 0"
            )

    if statements:
        with engine.begin() as connection:
            for stmt in statements:
                connection.execute(text(stmt))
        print(f"✅ Схема обновлена: {len(statements)} изм.")

    # DROP legacy mode после появления save_kind (повторный inspect)
    inspector = inspect(engine)
    if "game_profiles" in inspector.get_table_names():
        gp_cols = {item["name"] for item in inspector.get_columns("game_profiles")}
        if "mode" in gp_cols and "save_kind" in gp_cols:
            with engine.begin() as connection:
                connection.execute(text("ALTER TABLE game_profiles DROP COLUMN mode"))
            print("✅ Удалена колонка game_profiles.mode (save_kind)")

    # События: light/hardcore → game
    if "event_definitions" in inspector.get_table_names():
        with engine.begin() as connection:
            connection.execute(
                text(
                    "UPDATE event_definitions SET mode = 'game' WHERE mode IN ('light', 'hardcore')"
                )
            )

    # Сид базового шаблона Game (таблица создаётся metadata.create_all)
    inspector = inspect(engine)
    if "game_starter_templates" in inspector.get_table_names():
        blueprint = json.dumps(
            {
                "period_duration_seconds": 300,
                "cash_balance": 8000,
                "monthly_salary": 45000,
                "assets": [],
                "liabilities": [],
            },
            ensure_ascii=False,
        )
        with engine.begin() as connection:
            connection.execute(
                text(
                    """
                    INSERT INTO game_starter_templates
                      (template_key, title, difficulty_rank, base_monthly_lifestyle_expense,
                       blueprint_json, victory_config_json, is_active, sort_order)
                    VALUES
                      (:template_key, :title, :difficulty_rank, :base_expense,
                       :blueprint_json, '{}', 1, 10)
                    ON CONFLICT (template_key) DO NOTHING
                    """
                ),
                {
                    "template_key": "mq_game_basic_v1",
                    "title": "Базовый старт",
                    "difficulty_rank": 1,
                    "base_expense": 12000.0,
                    "blueprint_json": blueprint,
                },
            )


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
app.include_router(period_router)
app.include_router(events_router)
app.include_router(invest_router)
app.include_router(insurance_router)


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