from sqlalchemy.orm import Session

from ...finance.overview_build import build_finance_overview
from ...models import GameProfile
from ...schemas import FinanceOverview


def get_finance_overview(db: Session, profile: GameProfile) -> FinanceOverview:
    return build_finance_overview(db, profile)
