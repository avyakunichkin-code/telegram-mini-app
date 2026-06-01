from ..routers.auth import router as auth_router
from ..routers.users import router as users_router
from ..routers.health import router as health_router
from ..routers.finance import router as finance_router
from ..routers.game import router as game_router
from ..routers.period_actions import router as period_router
from ..routers.events import router as events_router
from ..routers.invest import router as invest_router
from ..routers.insurance import router as insurance_router
from ..routers.achievements import router as achievements_router
from ..routers.expenses import router as expenses_router
from ..routers.admin import router as admin_router
from ..routers.needs import router as needs_router

__all__ = [
    "auth_router",
    "users_router",
    "health_router",
    "finance_router",
    "game_router",
    "period_router",
    "events_router",
    "invest_router",
    "insurance_router",
    "achievements_router",
    "expenses_router",
    "admin_router",
    "needs_router",
]
