from sqlalchemy.orm import Session

from ...finance.expenses import compute_monthly_burn
from ...models import FinanceLiability, GameProfile, PeriodEconomyClosing
from ...schemas import (
    AnalyticsTimeseriesPoint,
    FinanceAnalyticsTimeseriesResponse,
)


def get_analytics_timeseries(
    db: Session,
    profile: GameProfile,
    *,
    limit: int = 48,
) -> FinanceAnalyticsTimeseriesResponse:
    limit = max(4, min(120, limit))

    closings_rows = (
        db.query(PeriodEconomyClosing)
        .filter(PeriodEconomyClosing.game_profile_id == profile.id)
        .order_by(PeriodEconomyClosing.period_index.desc())
        .limit(limit)
        .all()
    )
    closings_rows = list(reversed(closings_rows))

    liabilities_orm = (
        db.query(FinanceLiability)
        .filter(
            FinanceLiability.game_profile_id == profile.id,
            FinanceLiability.is_active == 1,
        )
        .all()
    )
    total_overdue_now = round(sum(float(l.overdue_amount or 0) for l in liabilities_orm), 2)
    burn_now = round(float(compute_monthly_burn(db, profile).total), 2)

    points: list[AnalyticsTimeseriesPoint] = [
        AnalyticsTimeseriesPoint(
            period_index=int(r.period_index),
            cash_balance=round(float(r.cash_balance), 2),
            safety_fund_balance=round(float(r.safety_fund_balance), 2),
            total_overdue_amount=round(float(r.total_overdue_amount), 2),
            monthly_burn_total=round(float(getattr(r, "monthly_burn_total", 0) or 0), 2),
            is_projection=False,
        )
        for r in closings_rows
    ]

    points.append(
        AnalyticsTimeseriesPoint(
            period_index=int(profile.period_index),
            cash_balance=round(float(profile.cash_balance), 2),
            safety_fund_balance=round(float(profile.safety_fund_balance), 2),
            total_overdue_amount=total_overdue_now,
            monthly_burn_total=burn_now,
            is_projection=True,
        )
    )

    return FinanceAnalyticsTimeseriesResponse(
        current_period_index=int(profile.period_index),
        clean_period_streak=int(getattr(profile, "clean_period_streak", 0) or 0),
        points=points,
    )
