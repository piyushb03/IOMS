import sqlalchemy as sa
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.logging import get_logger
from app.models.customer import Customer
from app.models.order import Order
from app.models.product import Product

logger = get_logger(__name__)


class DashboardService:
    """Service for computing dashboard summary metrics."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_summary(self) -> dict:
        """Return aggregate metrics for the dashboard."""
        total_products = await self.db.scalar(sa.select(sa.func.count(Product.id))) or 0
        total_customers = await self.db.scalar(sa.select(sa.func.count(Customer.id))) or 0
        total_orders = await self.db.scalar(sa.select(sa.func.count(Order.id))) or 0
        low_stock = await self.db.scalar(
            sa.select(sa.func.count(Product.id)).where(
                Product.quantity <= settings.low_stock_threshold
            )
        ) or 0

        logger.debug(
            "Dashboard summary: products=%s customers=%s orders=%s low_stock=%s",
            total_products,
            total_customers,
            total_orders,
            low_stock,
        )

        return {
            "total_products": total_products,
            "total_customers": total_customers,
            "total_orders": total_orders,
            "low_stock_products": low_stock,
        }
