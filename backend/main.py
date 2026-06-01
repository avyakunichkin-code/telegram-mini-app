import json

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.gzip import GZipMiddleware
from sqlalchemy import inspect, text

from app.cors_settings import resolve_cors_allow_origin_regex, resolve_cors_allow_origins
from app.database import engine, Base
from app.victory.seeds import VICTORY_CONFIG_BY_TEMPLATE_KEY, victory_config_json_for_template
from app.finance.expense_defaults import expense_budget_for_template
from app.finance.expenses import ensure_expense_category_catalog
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
)

from app.seeds.capital_catalog import upsert_capital_liability_catalog
from app.seeds.game_starter_templates import GAME_STARTER_TEMPLATE_SEEDS

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
    # ---- character needs (ADR-005/006) ----
    if "need_comfort" not in columns:
        statements.append("ALTER TABLE game_profiles ADD COLUMN need_comfort DOUBLE PRECISION NOT NULL DEFAULT 0")
    if "need_status" not in columns:
        statements.append("ALTER TABLE game_profiles ADD COLUMN need_status DOUBLE PRECISION NOT NULL DEFAULT 0")
    if "need_social" not in columns:
        statements.append("ALTER TABLE game_profiles ADD COLUMN need_social DOUBLE PRECISION NOT NULL DEFAULT 0")
    if "need_health" not in columns:
        statements.append("ALTER TABLE game_profiles ADD COLUMN need_health DOUBLE PRECISION NOT NULL DEFAULT 0")
    if "needs_zero_periods_streak" not in columns:
        statements.append(
            "ALTER TABLE game_profiles ADD COLUMN needs_zero_periods_streak INTEGER NOT NULL DEFAULT 0"
        )
    if "treat_self_last_period_index" not in columns:
        statements.append(
            "ALTER TABLE game_profiles ADD COLUMN treat_self_last_period_index INTEGER NOT NULL DEFAULT 0"
        )
    if "salary_miss_streak" not in columns:
        statements.append("ALTER TABLE game_profiles ADD COLUMN salary_miss_streak INTEGER NOT NULL DEFAULT 0")
    if "negative_close_streak" not in columns:
        statements.append("ALTER TABLE game_profiles ADD COLUMN negative_close_streak INTEGER NOT NULL DEFAULT 0")
    if "run_outcome" not in columns:
        statements.append("ALTER TABLE game_profiles ADD COLUMN run_outcome VARCHAR(16) NULL")
    if "victory_finale_shown_at" not in columns:
        statements.append("ALTER TABLE game_profiles ADD COLUMN victory_finale_shown_at TIMESTAMP NULL")

    if "users" in inspector.get_table_names():
        user_cols = {item["name"] for item in inspector.get_columns("users")}
        if "guidance_completed" not in user_cols:
            statements.append("ALTER TABLE users ADD COLUMN guidance_completed INTEGER NOT NULL DEFAULT 0")
        if "guidance_progress_json" not in user_cols:
            statements.append(
                "ALTER TABLE users ADD COLUMN guidance_progress_json TEXT NOT NULL DEFAULT '{}'"
            )
        if "guidance_completed_at" not in user_cols:
            statements.append("ALTER TABLE users ADD COLUMN guidance_completed_at TIMESTAMP NULL")

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
        if "liability_kind" not in liab_columns:
            statements.append(
                "ALTER TABLE finance_liabilities ADD COLUMN liability_kind VARCHAR(32) NOT NULL DEFAULT 'unsecured'"
            )
        if "secured_asset_id" not in liab_columns:
            statements.append("ALTER TABLE finance_liabilities ADD COLUMN secured_asset_id INTEGER NULL")
        if "term_periods" not in liab_columns:
            statements.append("ALTER TABLE finance_liabilities ADD COLUMN term_periods INTEGER NULL")
        if "periods_paid" not in liab_columns:
            statements.append(
                "ALTER TABLE finance_liabilities ADD COLUMN periods_paid INTEGER NOT NULL DEFAULT 0"
            )
        if "original_principal" not in liab_columns:
            statements.append("ALTER TABLE finance_liabilities ADD COLUMN original_principal FLOAT NULL")
        if "payment_mode" not in liab_columns:
            statements.append(
                "ALTER TABLE finance_liabilities ADD COLUMN payment_mode VARCHAR(32) NOT NULL DEFAULT 'interest_only'"
            )

    if "finance_assets" in inspector.get_table_names():
        asset_columns = {item["name"] for item in inspector.get_columns("finance_assets")}
        if "acquisition_mode" not in asset_columns:
            statements.append(
                "ALTER TABLE finance_assets ADD COLUMN acquisition_mode VARCHAR(16) NOT NULL DEFAULT 'cash'"
            )

    if "insurance_policies" in inspector.get_table_names():
        pol_columns = {item["name"] for item in inspector.get_columns("insurance_policies")}
        if "insured_asset_id" not in pol_columns:
            statements.append("ALTER TABLE insurance_policies ADD COLUMN insured_asset_id INTEGER NULL")

    if "liability_templates" in inspector.get_table_names():
        tpl_columns = {item["name"] for item in inspector.get_columns("liability_templates")}
        if "liability_kind" not in tpl_columns:
            statements.append(
                "ALTER TABLE liability_templates ADD COLUMN liability_kind VARCHAR(32) NOT NULL DEFAULT 'consumer'"
            )
        if "term_periods" not in tpl_columns:
            statements.append("ALTER TABLE liability_templates ADD COLUMN term_periods INTEGER NULL")
        if "disbursement_mode" not in tpl_columns:
            statements.append(
                "ALTER TABLE liability_templates ADD COLUMN disbursement_mode VARCHAR(32) NOT NULL DEFAULT 'to_cash'"
            )
        if "linked_asset_template_key" not in tpl_columns:
            statements.append(
                "ALTER TABLE liability_templates ADD COLUMN linked_asset_template_key VARCHAR(80) NULL"
            )
        if "down_payment_amount" not in tpl_columns:
            statements.append(
                "ALTER TABLE liability_templates ADD COLUMN down_payment_amount FLOAT NOT NULL DEFAULT 0"
            )
        if "requires_asset_kind" not in tpl_columns:
            statements.append(
                "ALTER TABLE liability_templates ADD COLUMN requires_asset_kind VARCHAR(50) NULL"
            )

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
        if "content_class" not in ed_cols:
            statements.append(
                "ALTER TABLE event_definitions ADD COLUMN content_class VARCHAR(32) NOT NULL DEFAULT 'universal'"
            )
        if "event_slot" not in ed_cols:
            statements.append(
                "ALTER TABLE event_definitions ADD COLUMN event_slot VARCHAR(32) NOT NULL DEFAULT 'period_choice'"
            )
        if "audience_template_keys" not in ed_cols:
            statements.append(
                'ALTER TABLE event_definitions ADD COLUMN audience_template_keys TEXT NOT NULL DEFAULT \'["all"]\''
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
        if "has_tenants" not in asset_columns:
            statements.append("ALTER TABLE finance_assets ADD COLUMN has_tenants INTEGER NOT NULL DEFAULT 0")

    if "asset_templates" in inspector.get_table_names():
        at_cols = {item["name"] for item in inspector.get_columns("asset_templates")}
        if "estate_role" not in at_cols:
            statements.append(
                "ALTER TABLE asset_templates ADD COLUMN estate_role VARCHAR(20) NOT NULL DEFAULT 'owned'"
            )
        if "monthly_rent_cost" not in at_cols:
            statements.append(
                "ALTER TABLE asset_templates ADD COLUMN monthly_rent_cost DOUBLE PRECISION NOT NULL DEFAULT 0"
            )
        if "monthly_utilities_cost" not in at_cols:
            statements.append(
                "ALTER TABLE asset_templates ADD COLUMN monthly_utilities_cost DOUBLE PRECISION NOT NULL DEFAULT 0"
            )
        if "income_yield_annual" not in at_cols:
            statements.append("ALTER TABLE asset_templates ADD COLUMN income_yield_annual DOUBLE PRECISION NULL")
        if "has_tenants_default" not in at_cols:
            statements.append(
                "ALTER TABLE asset_templates ADD COLUMN has_tenants_default INTEGER NOT NULL DEFAULT 0"
            )

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

    # DL1: каталог обязательств (car_loan secured, mortgage metadata)
    inspector = inspect(engine)
    if "liability_templates" in inspector.get_table_names():
        lt_cols = {item["name"] for item in inspector.get_columns("liability_templates")}
        if "liability_kind" in lt_cols:
            from app.database import SessionLocal

            db = SessionLocal()
            try:
                upsert_capital_liability_catalog(db)
            finally:
                db.close()

    # Optional lint: if victory_goals table exists, report issues.
    # This is non-blocking by default to avoid breaking boot on incomplete DBs.
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