"""Каталог цепочек достижений (GAME.md §5.3). Контент и XP редактируются без смены схемы."""

from __future__ import annotations

import json

from sqlalchemy.orm import Session

from .achievement_engine import CRITERIA_SCHEMA_VERSION
from .models import AchievementChain, AchievementTierDefinition


def _crit(ctype: str, **kwargs) -> str:
    payload = {"schema_version": CRITERIA_SCHEMA_VERSION, "type": ctype, **kwargs}
    return json.dumps(payload, ensure_ascii=False)


def _tier(tier_index: int, tier_key: str, title: str, description: str, xp: int, criteria_json: str) -> dict:
    return {
        "tier_index": tier_index,
        "tier_key": tier_key,
        "title": title,
        "description": description,
        "xp_reward": xp,
        "criteria_json": criteria_json,
    }


ACHIEVEMENT_CHAIN_SPECS: list[dict] = [
    {
        "chain_key": "safety_fund",
        "category": "safety_fund",
        "title": "Подушка безопасности",
        "description": "Накопите резерв в месяцах расходов.",
        "sort_order": 10,
        "tiers": [
            _tier(1, "safety_fund_t1", "Первая подушка", "Подушка ≥ 1 месяца расходов", 15, _crit("safety_fund_months", months_multiplier=1)),
            _tier(2, "safety_fund_t2", "Защита на квартал", "Подушка ≥ 3 месяцев расходов", 40, _crit("safety_fund_months", months_multiplier=3)),
            _tier(3, "safety_fund_t3", "Полгода спокойствия", "Подушка ≥ 6 месяцев расходов", 100, _crit("safety_fund_months", months_multiplier=6)),
            _tier(4, "safety_fund_t4", "Годовой запас", "Подушка ≥ 12 месяцев расходов", 250, _crit("safety_fund_months", months_multiplier=12)),
        ],
    },
    {
        "chain_key": "deposit",
        "category": "deposit",
        "title": "Вклад",
        "description": "Дисциплина сбережений через депозит.",
        "sort_order": 20,
        "tiers": [
            _tier(1, "deposit_t1", "Первый вклад", "Открыть вклад от 1 000 ₽", 10, _crit("deposit_opened", min_principal=1000)),
            _tier(2, "deposit_t2", "Серьёзный вклад", "Сумма вклада ≥ 2 зарплат", 30, _crit("stub", note="deposit_vs_salary")),
            _tier(3, "deposit_t3", "Капитализация", "Накопленные % ≥ 10 000 ₽", 80, _crit("stub", note="deposit_interest_cumul")),
            _tier(4, "deposit_t4", "Покрытие статьи", "% вклада покрывают статью расходов", 200, _crit("stub", note="deposit_covers_expense")),
        ],
    },
    {
        "chain_key": "insurance",
        "category": "insurance",
        "title": "Страховки",
        "description": "Защита от редких крупных рисков.",
        "sort_order": 30,
        "tiers": [
            _tier(1, "insurance_t1", "Первый полис", "Оформить любую страховку", 10, _crit("insurance_active_count", min_count=1)),
            _tier(2, "insurance_t2", "Две линии защиты", "Два разных полиса", 30, _crit("insurance_active_count", min_count=2)),
            _tier(3, "insurance_t3", "Выплата сработала", "Страховая выплата > 50% ущерба", 70, _crit("stub", note="insurance_claim_ratio")),
            _tier(4, "insurance_t4", "Долгий покой", "24 периода без «голого» шока", 150, _crit("stub", note="insurance_no_naked_shock")),
        ],
    },
    {
        "chain_key": "credit",
        "category": "credit",
        "title": "Кредиты",
        "description": "Дисциплина обслуживания долгов.",
        "sort_order": 40,
        "tiers": [
            _tier(1, "credit_t1", "Платёж в срок", "Первый платёж по долгу без просрочки", 10, _crit("clean_period_streak", min_periods=1)),
            _tier(2, "credit_t2", "Досрочное погашение", "Досрочка ≥ 30% тела", 40, _crit("stub", note="early_repayment")),
            _tier(3, "credit_t3", "Закрытие долга", "Закрыть кредит с переплатой < 15%", 100, _crit("stub", note="loan_closed")),
            _tier(4, "credit_t4", "Крупный выход", "Раннее закрытие крупного долга", 300, _crit("stub", note="large_loan_early_close")),
        ],
    },
    {
        "chain_key": "investment",
        "category": "investment",
        "title": "Инвестиции",
        "description": "Облигации и пассивный доход (без акций в scope).",
        "sort_order": 50,
        "tiers": [
            _tier(1, "investment_t1", "Первая бумага", "Купить облигацию", 15, _crit("bond_count", min_count=1)),
            _tier(2, "investment_t2", "Портфель облигаций", "Три облигации в портфеле", 50, _crit("bond_count", min_count=3)),
            _tier(3, "investment_t3", "Пассивный поток", "Пассивный доход > 5% расходов", 120, _crit("stub", note="passive_income_5pct")),
            _tier(4, "investment_t4", "Сильный пассив", "Пассивный доход > 30% расходов", 300, _crit("stub", note="passive_income_30pct")),
        ],
    },
    {
        "chain_key": "capital",
        "category": "capital",
        "title": "Капитал",
        "description": "Чистая ликвидная позиция.",
        "sort_order": 60,
        "tiers": [
            _tier(1, "capital_t1", "В плюсе", "Чистый капитал > 0", 10, _crit("liquid_net_worth", min_amount=1)),
            _tier(2, "capital_t2", "Полгода дохода", "Ликвидность > 6 месяцев дохода", 50, _crit("stub", note="liquid_vs_salary_6")),
            _tier(3, "capital_t3", "Два года дохода", "Ликвидность > 24 месяцев дохода", 150, _crit("stub", note="liquid_vs_salary_24")),
            _tier(4, "capital_t4", "Капитал 100k", "Ликвидность ≥ 100 000 ₽", 500, _crit("liquid_net_worth", min_amount=100_000)),
        ],
    },
]


def ensure_achievement_catalog(db: Session) -> None:
    for spec in ACHIEVEMENT_CHAIN_SPECS:
        tiers = spec["tiers"]
        max_tier = max(int(t["tier_index"]) for t in tiers)

        chain = db.query(AchievementChain).filter(AchievementChain.chain_key == spec["chain_key"]).first()
        if not chain:
            chain = AchievementChain(
                chain_key=spec["chain_key"],
                category=spec["category"],
                title=spec["title"],
                description=spec.get("description", ""),
                max_tier=max_tier,
                is_active=1,
                sort_order=int(spec.get("sort_order", 100)),
            )
            db.add(chain)
            db.flush()
        else:
            chain.title = spec["title"]
            chain.description = spec.get("description", "")
            chain.max_tier = max_tier
            chain.sort_order = int(spec.get("sort_order", 100))

        for t in tiers:
            existing = (
                db.query(AchievementTierDefinition)
                .filter(AchievementTierDefinition.tier_key == t["tier_key"])
                .first()
            )
            if existing:
                existing.title = t["title"]
                existing.description = t["description"]
                existing.xp_reward = int(t["xp_reward"])
                existing.criteria_json = t["criteria_json"]
                existing.tier_index = int(t["tier_index"])
                continue
            db.add(
                AchievementTierDefinition(
                    chain_key=spec["chain_key"],
                    tier_index=int(t["tier_index"]),
                    tier_key=t["tier_key"],
                    title=t["title"],
                    description=t["description"],
                    criteria_json=t["criteria_json"],
                    xp_reward=int(t["xp_reward"]),
                    sort_order=int(t["tier_index"]) * 10,
                )
            )
    db.commit()
