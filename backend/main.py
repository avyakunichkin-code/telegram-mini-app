import json

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect, text

from app.database import engine, Base
from app.victory_seeds import VICTORY_CONFIG_BY_TEMPLATE_KEY, victory_config_json_for_template
from app.expense_template_defaults import expense_budget_for_template
from app.expenses import ensure_expense_category_catalog
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
)

# Каталог стартов Game: сортируется sort_order; ON CONFLICT не обновляет существующие строки.
GAME_STARTER_TEMPLATE_SEEDS = [
    {
        "template_key": "mq_game_basic_v1",
        "title": "Студент",
        "difficulty_rank": 1,
        "base_expense": 25000.0,
        "sort_order": 10,
        "blueprint": {
            "description": "Первый бюджет без долгов: комфортный free flow и запас на счёте — освоить цикл периода.",
            "scenario_icon": "fresh_start",
            "compare_note": "Идеальный вход: зарплата 50k, жизнь ~25k, без обязательств.",
            "highlights": [
                "Доход ~50 000 ₽/мес",
                "Расходы на жизнь ~25 000 ₽/мес",
                "Свободно ~25 000 ₽/мес после расходов",
                "Чистый старт — без долгов и активов",
                "На счёте ~15 000 ₽",
            ],
            "period_duration_seconds": 300,
            "cash_balance": 15000,
            "monthly_salary": 50000,
            "assets": [],
            "liabilities": [],
        },
    },
    {
        "template_key": "mq_game_tight_budget_v1",
        "title": "Профессионал",
        "difficulty_rank": 2,
        "base_expense": 56000.0,
        "sort_order": 20,
        "blueprint": {
            "description": "Карьера и аренда: машина из каталога, автокредит, жильё снимаешь — free flow уже плотнее.",
            "scenario_icon": "car_loan",
            "compare_note": "После Студента: авто 1,2 млн, обслуживание ~18k, аренда в бюджете жилья.",
            "highlights": [
                "Доход ~100 000 ₽/мес",
                "Расходы на жизнь ~56 000 ₽/мес (в т.ч. аренда ~28 000)",
                "Авто: обслуживание ~18 000 ₽/мес + кредит ~12 000",
                "Свободно ~14 000 ₽/мес после обязательств",
                "На счёте ~25 000 ₽",
            ],
            "period_duration_seconds": 300,
            "cash_balance": 25000,
            "monthly_salary": 100000,
            "assets": [
                {
                    "title": "Личная машина",
                    "kind": "car_personal",
                    "asset_value": 1200000,
                    "monthly_maintenance_cost": 18000,
                    "monthly_income": 0,
                },
            ],
            "liabilities": [
                {
                    "title": "Автокредит",
                    "total_debt": 900000,
                    "annual_rate_percent": 16,
                },
            ],
        },
    },
    {
        "template_key": "mq_game_mortgage_stress_v1",
        "title": "Руководитель",
        "difficulty_rank": 3,
        "base_expense": 68000.0,
        "sort_order": 30,
        "blueprint": {
            "description": "Семья: своя квартира, ипотека, два автомобиля — несколько потоков платежей и узкий free flow.",
            "scenario_icon": "home_mortgage",
            "compare_note": "Ипотека ~30k/мес, два авто по ~18k, жильё в burn ~32k на семью.",
            "highlights": [
                "Доход ~150 000 ₽/мес",
                "Расходы на жизнь ~68 000 ₽/мес",
                "Квартира в активах, ипотека ~2,7 млн",
                "Два автомобиля, обслуживание ~36 000 ₽/мес",
                "Свободно ~10 000 ₽/мес",
                "На счёте ~35 000 ₽",
            ],
            "period_duration_seconds": 300,
            "cash_balance": 35000,
            "monthly_salary": 150000,
            "assets": [
                {
                    "title": "Квартира",
                    "kind": "home",
                    "asset_value": 4500000,
                    "monthly_maintenance_cost": 6000,
                    "monthly_income": 0,
                },
                {
                    "title": "Семейный автомобиль",
                    "kind": "car_personal",
                    "asset_value": 1200000,
                    "monthly_maintenance_cost": 18000,
                    "monthly_income": 0,
                },
                {
                    "title": "Второй автомобиль",
                    "kind": "car_personal",
                    "asset_value": 1200000,
                    "monthly_maintenance_cost": 18000,
                    "monthly_income": 0,
                },
            ],
            "liabilities": [
                {
                    "title": "Ипотека",
                    "total_debt": 2700000,
                    "annual_rate_percent": 13.5,
                },
            ],
        },
    },
    {
        "template_key": "mq_game_debt_stack_v1",
        "title": "Предприниматель",
        "difficulty_rank": 4,
        "base_expense": 108000.0,
        "sort_order": 40,
        "blueprint": {
            "description": "Максимум инструментов: свой дом, арендная квартира, два авто, ипотека и карта — free flow около нуля.",
            "scenario_icon": "factory",
            "compare_note": "Зарплата 200k, но обязательства ~95k; аренда даёт +35k к доходу актива.",
            "highlights": [
                "Доход ~200 000 ₽/мес",
                "Расходы на жизнь ~108 000 ₽/мес",
                "Ипотека ~3,8 млн + кредитная карта",
                "Два авто, доходная аренда +35 000 ₽/мес",
                "Свободно ~−3 000 ₽/мес до дохода активов",
                "На счёте ~45 000 ₽",
            ],
            "period_duration_seconds": 300,
            "cash_balance": 45000,
            "monthly_salary": 200000,
            "assets": [
                {
                    "title": "Жилая квартира",
                    "kind": "home",
                    "asset_value": 4500000,
                    "monthly_maintenance_cost": 6000,
                    "monthly_income": 0,
                },
                {
                    "title": "Квартира под сдачу",
                    "kind": "rental_home",
                    "asset_value": 5200000,
                    "monthly_maintenance_cost": 7000,
                    "monthly_income": 35000,
                },
                {
                    "title": "Автомобиль",
                    "kind": "car_personal",
                    "asset_value": 1200000,
                    "monthly_maintenance_cost": 18000,
                    "monthly_income": 0,
                },
                {
                    "title": "Второй автомобиль",
                    "kind": "car_personal",
                    "asset_value": 1200000,
                    "monthly_maintenance_cost": 18000,
                    "monthly_income": 0,
                },
            ],
            "liabilities": [
                {
                    "title": "Ипотека",
                    "total_debt": 3800000,
                    "annual_rate_percent": 13.5,
                },
                {
                    "title": "Кредитная карта",
                    "total_debt": 150000,
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
    if "onboarding_step" not in columns:
        statements.append(
            "ALTER TABLE game_profiles ADD COLUMN onboarding_step VARCHAR(40) NOT NULL DEFAULT 'period_timer'"
        )
    if "clean_period_streak" not in columns:
        statements.append("ALTER TABLE game_profiles ADD COLUMN clean_period_streak INTEGER NOT NULL DEFAULT 0")
    if "progression_milestones_awarded" not in columns:
        statements.append(
            "ALTER TABLE game_profiles ADD COLUMN progression_milestones_awarded TEXT NOT NULL DEFAULT '[]'"
        )

    if "period_snapshots" in inspector.get_table_names():
        ps_cols = {item["name"] for item in inspector.get_columns("period_snapshots")}
        if "safety_contribute_xp_grants" not in ps_cols:
            statements.append(
                "ALTER TABLE period_snapshots ADD COLUMN safety_contribute_xp_grants INTEGER NOT NULL DEFAULT 0"
            )
        if "safety_withdraw_xp_grants" not in ps_cols:
            statements.append(
                "ALTER TABLE period_snapshots ADD COLUMN safety_withdraw_xp_grants INTEGER NOT NULL DEFAULT 0"
            )

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

    # ---- period_economy_closings (E1 burn в аналитике) ----
    if "period_economy_closings" in inspector.get_table_names():
        pec_cols = {item["name"] for item in inspector.get_columns("period_economy_closings")}
        if "monthly_burn_total" not in pec_cols:
            statements.append(
                "ALTER TABLE period_economy_closings ADD COLUMN monthly_burn_total DOUBLE PRECISION NOT NULL DEFAULT 0"
            )
        if "period_income_rate" not in pec_cols:
            statements.append(
                "ALTER TABLE period_economy_closings ADD COLUMN period_income_rate DOUBLE PRECISION NOT NULL DEFAULT 0"
            )
        if "period_expense_total" not in pec_cols:
            statements.append(
                "ALTER TABLE period_economy_closings ADD COLUMN period_expense_total DOUBLE PRECISION NOT NULL DEFAULT 0"
            )
        if "total_debt_balance" not in pec_cols:
            statements.append(
                "ALTER TABLE period_economy_closings ADD COLUMN total_debt_balance DOUBLE PRECISION NOT NULL DEFAULT 0"
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
        print(f"[OK] Схема обновлена: {len(statements)} изм.")

    # DROP legacy mode после появления save_kind (повторный inspect)
    inspector = inspect(engine)
    if "game_profiles" in inspector.get_table_names():
        gp_cols = {item["name"] for item in inspector.get_columns("game_profiles")}
        if "mode" in gp_cols and "save_kind" in gp_cols:
            with engine.begin() as connection:
                connection.execute(text("ALTER TABLE game_profiles DROP COLUMN mode"))
            print("[OK] Удалена колонка game_profiles.mode (save_kind)")

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
        gst_cols = {item["name"] for item in inspector.get_columns("game_starter_templates")}
        if "applies_to_save_kind" not in gst_cols:
            with engine.begin() as connection:
                connection.execute(
                    text(
                        "ALTER TABLE game_starter_templates ADD COLUMN applies_to_save_kind VARCHAR(20) NOT NULL DEFAULT 'game'"
                    )
                )
        stmt = text(
            """
            INSERT INTO game_starter_templates
              (template_key, title, difficulty_rank, base_monthly_lifestyle_expense,
               blueprint_json, victory_config_json, is_active, sort_order, applies_to_save_kind)
            VALUES
              (:template_key, :title, :difficulty_rank, :base_expense,
               :blueprint_json, '{}', 1, :sort_order, 'game')
            ON CONFLICT (template_key) DO UPDATE SET
              title = EXCLUDED.title,
              difficulty_rank = EXCLUDED.difficulty_rank,
              base_monthly_lifestyle_expense = EXCLUDED.base_monthly_lifestyle_expense,
              blueprint_json = EXCLUDED.blueprint_json,
              sort_order = EXCLUDED.sort_order
            """
        )
        with engine.begin() as connection:
            for seed in GAME_STARTER_TEMPLATE_SEEDS:
                tk = seed["template_key"]
                bp = dict(seed["blueprint"])
                base_exp = float(seed["base_expense"])
                bp["expense_budget"] = expense_budget_for_template(tk, base_exp, bp)
                connection.execute(
                    stmt,
                    {
                        "template_key": tk,
                        "title": seed["title"],
                        "difficulty_rank": int(seed["difficulty_rank"]),
                        "base_expense": base_exp,
                        "sort_order": int(seed["sort_order"]),
                        "blueprint_json": json.dumps(bp, ensure_ascii=False),
                    },
                )
            update_victory = text(
                """
                UPDATE game_starter_templates
                SET victory_config_json = :victory_json
                WHERE template_key = :template_key
                """
            )
            for tk in VICTORY_CONFIG_BY_TEMPLATE_KEY:
                connection.execute(
                    update_victory,
                    {
                        "template_key": tk,
                        "victory_json": victory_config_json_for_template(tk),
                    },
                )


# Создаём/обновляем таблицы
Base.metadata.create_all(bind=engine)
ensure_schema_compatibility()

from app.database import SessionLocal

_db_boot = SessionLocal()
try:
    ensure_expense_category_catalog(_db_boot)
    _db_boot.commit()
except Exception:
    _db_boot.rollback()
finally:
    _db_boot.close()

print("[OK] Таблицы созданы/проверены")

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
app.include_router(expenses_router)
app.include_router(admin_router)


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