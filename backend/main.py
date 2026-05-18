import json

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect, text

from app.database import engine, Base
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
)

# Каталог стартов Game: сортируется sort_order; ON CONFLICT не обновляет существующие строки.
GAME_STARTER_TEMPLATE_SEEDS = [
    {
        "template_key": "mq_game_basic_v1",
        "title": "Базовый старт",
        "difficulty_rank": 1,
        "base_expense": 9600.0,
        "sort_order": 10,
        "blueprint": {
            "description": "Без долгов и обслуживания активов — чтобы освоить цикл периода без давления платежей.",
            "period_duration_seconds": 300,
            "cash_balance": 15000,
            "monthly_salary": 50000,
            "assets": [],
            "liabilities": [],
        },
    },
    {
        "template_key": "mq_game_tight_budget_v1",
        "title": "Зарплата до зарплаты",
        "difficulty_rank": 2,
        "base_expense": 14800.0,
        "sort_order": 20,
        "blueprint": {
            "description": "Мало наличных на старте, потребительский кредит и авто с обслуживанием.",
            "period_duration_seconds": 300,
            "cash_balance": 9000,
            "monthly_salary": 45000,
            "assets": [
                {
                    "title": "Авто",
                    "kind": "vehicle",
                    "asset_value": 210000,
                    "monthly_maintenance_cost": 3000,
                    "monthly_income": 0,
                },
            ],
            "liabilities": [
                {
                    "title": "Потребительский кредит",
                    "total_debt": 240000,
                    "annual_rate_percent": 19,
                },
            ],
        },
    },
    {
        "template_key": "mq_game_mortgage_stress_v1",
        "title": "Ипотека под давлением",
        "difficulty_rank": 3,
        "base_expense": 17100.0,
        "sort_order": 30,
        "blueprint": {
            "description": "Высокий ипотечный платёж и машина: ошибки по кэшу быстро ощущаются.",
            "period_duration_seconds": 300,
            "cash_balance": 6500,
            "monthly_salary": 46500,
            "assets": [
                {
                    "title": "Авто",
                    "kind": "vehicle",
                    "asset_value": 260000,
                    "monthly_maintenance_cost": 4000,
                    "monthly_income": 0,
                },
            ],
            "liabilities": [
                {
                    "title": "Ипотека",
                    "total_debt": 690000,
                    "annual_rate_percent": 13.5,
                },
            ],
        },
    },
    {
        "template_key": "mq_game_debt_stack_v1",
        "title": "Красная зона",
        "difficulty_rank": 4,
        "base_expense": 19600.0,
        "sort_order": 40,
        "blueprint": {
            "description": "Два долга, «жизнь» дороже и почти пустой счёт — для опытных игроков.",
            "period_duration_seconds": 300,
            "cash_balance": 4500,
            "monthly_salary": 43500,
            "assets": [
                {
                    "title": "Подержанное авто",
                    "kind": "vehicle",
                    "asset_value": 145000,
                    "monthly_maintenance_cost": 2900,
                    "monthly_income": 0,
                },
            ],
            "liabilities": [
                {
                    "title": "Ипотека",
                    "total_debt": 520000,
                    "annual_rate_percent": 14,
                },
                {
                    "title": "Кредитная карта",
                    "total_debt": 110000,
                    "annual_rate_percent": 24,
                },
            ],
        },
    },
]


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
        if "event_tier" not in ed_cols:
            statements.append("ALTER TABLE event_definitions ADD COLUMN event_tier INTEGER NOT NULL DEFAULT 1")
        if "repeat_policy" not in ed_cols:
            statements.append(
                "ALTER TABLE event_definitions ADD COLUMN repeat_policy VARCHAR(32) NOT NULL DEFAULT 'repeatable'"
            )
        if "cooldown_periods" not in ed_cols:
            statements.append(
                "ALTER TABLE event_definitions ADD COLUMN cooldown_periods INTEGER NOT NULL DEFAULT 0"
            )
        if "repeat_max" not in ed_cols:
            statements.append("ALTER TABLE event_definitions ADD COLUMN repeat_max INTEGER NULL")
        if "mandatory_gate" not in ed_cols:
            statements.append(
                "ALTER TABLE event_definitions ADD COLUMN mandatory_gate VARCHAR(32) NOT NULL DEFAULT 'none'"
            )
        if "prerequisites_json" not in ed_cols:
            statements.append(
                "ALTER TABLE event_definitions ADD COLUMN prerequisites_json TEXT NOT NULL DEFAULT '{}'"
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

    # Каталог шаблонов старта Game (идемпотентно)
    inspector = inspect(engine)
    if "game_starter_templates" in inspector.get_table_names():
        stmt = text(
            """
            INSERT INTO game_starter_templates
              (template_key, title, difficulty_rank, base_monthly_lifestyle_expense,
               blueprint_json, victory_config_json, is_active, sort_order)
            VALUES
              (:template_key, :title, :difficulty_rank, :base_expense,
               :blueprint_json, '{}', 1, :sort_order)
            ON CONFLICT (template_key) DO NOTHING
            """
        )
        with engine.begin() as connection:
            for seed in GAME_STARTER_TEMPLATE_SEEDS:
                connection.execute(
                    stmt,
                    {
                        "template_key": seed["template_key"],
                        "title": seed["title"],
                        "difficulty_rank": int(seed["difficulty_rank"]),
                        "base_expense": float(seed["base_expense"]),
                        "sort_order": int(seed["sort_order"]),
                        "blueprint_json": json.dumps(seed["blueprint"], ensure_ascii=False),
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
app.include_router(finance_router)
app.include_router(game_router)
app.include_router(period_router)
app.include_router(events_router)
app.include_router(invest_router)
app.include_router(insurance_router)
app.include_router(achievements_router)


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