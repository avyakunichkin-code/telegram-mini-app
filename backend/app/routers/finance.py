from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..database import get_db
from ..game.time import get_active_game_profile, sync_time
from ..starters.mechanics import (
    MECHANIC_CAPITAL_LIABILITIES,
    MECHANIC_CAPITAL_PROPERTY,
    require_capital_mechanic,
)
from ..schemas import (
    SalaryProfileUpdate,
    SalaryProfileResponse,
    LiabilityCreate,
    LiabilityResponse,
    AssetCreate,
    AssetResponse,
    SecuredAcquisitionResponse,
    FinanceOverview,
    FinanceAnalyticsTimeseriesResponse,
)
from ..services.finance.salary import upsert_salary_profile as service_upsert_salary_profile
from ..finance.liability_present import liability_to_response
from ..services.finance.acquisitions import create_secured_acquisition
from ..services.finance.liabilities import (
    create_liability as service_create_liability,
    list_liabilities as service_list_liabilities,
    delete_liability as service_delete_liability,
    create_liability_from_template as service_create_liability_from_template,
    prepay_liability as service_prepay_liability,
)
from ..services.finance.assets import (
    create_asset as service_create_asset,
    list_assets as service_list_assets,
    delete_asset as service_delete_asset,
    create_asset_from_template as service_create_asset_from_template,
)
from ..services.finance.templates import (
    list_asset_templates as service_list_asset_templates,
    list_liability_templates as service_list_liability_templates,
)
from ..services.finance.transactions import (
    list_transactions as service_list_transactions,
)
from ..services.finance.overview import (
    get_finance_overview as service_get_finance_overview,
)
from ..services.finance.analytics import (
    get_analytics_timeseries as service_get_analytics_timeseries,
)

router = APIRouter(prefix="/api/finance", tags=["finance"])

@router.put("/salary", response_model=SalaryProfileResponse)
async def upsert_salary_profile(
    payload: SalaryProfileUpdate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    game_profile = get_active_game_profile(db, current_user.id)
    sync_time(game_profile)
    return service_upsert_salary_profile(db, game_profile, payload)


@router.post("/liabilities", response_model=LiabilityResponse)
async def create_liability(
    payload: LiabilityCreate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    game_profile = get_active_game_profile(db, current_user.id)
    sync_time(game_profile)
    require_capital_mechanic(db, game_profile, MECHANIC_CAPITAL_LIABILITIES)
    row = service_create_liability(db, game_profile, payload)
    return liability_to_response(row)


@router.get("/liabilities", response_model=list[LiabilityResponse])
async def list_liabilities(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    game_profile = get_active_game_profile(db, current_user.id)
    sync_time(game_profile)
    rows = service_list_liabilities(db, game_profile)
    return [liability_to_response(r) for r in rows]


@router.get("/transactions")
async def get_transactions(
        limit: int = 50,
        offset: int = 0,
        current_user=Depends(get_current_user),
        db: Session = Depends(get_db)
):
    profile = get_active_game_profile(db, current_user.id)
    return service_list_transactions(db, profile, limit=limit, offset=offset)


@router.delete("/liabilities/{liability_id}")
async def delete_liability(
    liability_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    game_profile = get_active_game_profile(db, current_user.id)
    sync_time(game_profile)
    return service_delete_liability(db, game_profile, liability_id)


@router.post("/acquisitions/secured", response_model=SecuredAcquisitionResponse)
async def create_secured_acquisition_route(
    payload: dict,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    game_profile = get_active_game_profile(db, current_user.id)
    sync_time(game_profile)
    require_capital_mechanic(db, game_profile, MECHANIC_CAPITAL_LIABILITIES)
    require_capital_mechanic(db, game_profile, MECHANIC_CAPITAL_PROPERTY)
    result = create_secured_acquisition(
        db,
        game_profile,
        liability_key=(payload.get("liability_key") or payload.get("key") or "").strip(),
        asset_key=(payload.get("asset_key") or "").strip(),
        down_payment=payload.get("down_payment"),
    )
    asset = result["asset"]
    liability = result["liability"]
    return SecuredAcquisitionResponse(
        asset=AssetResponse(
            id=asset.id,
            title=asset.title,
            kind=asset.kind,
            asset_value=asset.asset_value,
            monthly_maintenance_cost=asset.monthly_maintenance_cost,
            monthly_income=float(asset.monthly_income or 0),
            created_at=asset.created_at,
            acquisition_mode=getattr(asset, "acquisition_mode", None) or "secured",
        ),
        liability=liability_to_response(liability),
    )


@router.post("/liabilities/{liability_id}/prepay", response_model=LiabilityResponse)
async def prepay_liability_route(
    liability_id: int,
    payload: dict,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    game_profile = get_active_game_profile(db, current_user.id)
    sync_time(game_profile)
    require_capital_mechanic(db, game_profile, MECHANIC_CAPITAL_LIABILITIES)
    amount = float(payload.get("amount") or 0)
    row = service_prepay_liability(db, game_profile, liability_id, amount)
    return liability_to_response(row)


@router.post("/liabilities/from-template", response_model=LiabilityResponse)
async def create_liability_from_template(
    payload: dict,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    game_profile = get_active_game_profile(db, current_user.id)
    sync_time(game_profile)
    require_capital_mechanic(db, game_profile, MECHANIC_CAPITAL_LIABILITIES)
    key = (payload.get("key") or "").strip()
    row = service_create_liability_from_template(db, game_profile, key=key)
    return liability_to_response(row)


@router.post("/assets", response_model=AssetResponse)
async def create_asset(
    payload: AssetCreate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    game_profile = get_active_game_profile(db, current_user.id)
    sync_time(game_profile)
    require_capital_mechanic(db, game_profile, MECHANIC_CAPITAL_PROPERTY)
    return service_create_asset(db, game_profile, payload)


@router.get("/assets", response_model=list[AssetResponse])
async def list_assets(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    game_profile = get_active_game_profile(db, current_user.id)
    sync_time(game_profile)
    return service_list_assets(db, game_profile)


@router.get("/asset-templates")
async def list_asset_templates(db: Session = Depends(get_db)):
    return service_list_asset_templates(db)


@router.get("/liability-templates")
async def list_liability_templates(db: Session = Depends(get_db)):
    return service_list_liability_templates(db)


@router.post("/assets/from-template", response_model=AssetResponse)
async def create_asset_from_template(
    payload: dict,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    game_profile = get_active_game_profile(db, current_user.id)
    sync_time(game_profile)
    require_capital_mechanic(db, game_profile, MECHANIC_CAPITAL_PROPERTY)
    key = (payload.get("key") or "").strip()
    return service_create_asset_from_template(db, game_profile, key=key)


@router.delete("/assets/{asset_id}")
async def delete_asset(
    asset_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    game_profile = get_active_game_profile(db, current_user.id)
    sync_time(game_profile)
    return service_delete_asset(db, game_profile, asset_id)


@router.get("/overview", response_model=FinanceOverview)
async def finance_overview(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profile = get_active_game_profile(db, current_user.id)
    sync_time(profile)
    return service_get_finance_overview(db, profile)


@router.get("/analytics/timeseries", response_model=FinanceAnalyticsTimeseriesResponse)
async def finance_analytics_timeseries(
    limit: int = 48,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profile = get_active_game_profile(db, current_user.id)
    sync_time(profile)
    return service_get_analytics_timeseries(db, profile, limit=limit)
