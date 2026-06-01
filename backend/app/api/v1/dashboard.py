from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.schemas.product import ok
from app.services.dashboard_service import DashboardService

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/summary")
async def get_dashboard_summary(db: AsyncSession = Depends(get_db)) -> dict:
    """
    Return aggregate business metrics:
      - total_products
      - total_customers
      - total_orders
      - low_stock_products
    """
    service = DashboardService(db)
    summary = await service.get_summary()
    return ok("Dashboard summary retrieved successfully.", summary)
