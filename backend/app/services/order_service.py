import math
from decimal import Decimal

import sqlalchemy as sa
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.logging import get_logger
from app.models.order import Order
from app.models.order_item import OrderItem
from app.models.product import Product
from app.schemas.order import OrderCreate, OrderListResponse, OrderResponse

logger = get_logger(__name__)


class OrderNotFoundError(Exception):
    pass


class InsufficientStockError(Exception):
    pass


class CustomerNotFoundError(Exception):
    pass


class OrderService:
    """Business logic for Order management.

    All order creation runs inside a single atomic transaction:
      1. Validate customer exists
      2. Validate and lock all products
      3. Check sufficient stock for each
      4. Create the Order record
      5. Create OrderItem records
      6. Reduce product inventory
    """

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def create(self, payload: OrderCreate) -> Order:
        """Create an order atomically, reducing inventory on success."""
        from app.models.customer import Customer

        # 1. Validate customer
        customer = await self.db.scalar(
            sa.select(Customer).where(Customer.id == payload.customer_id)
        )
        if not customer:
            raise CustomerNotFoundError(
                f"Customer with id '{payload.customer_id}' not found."
            )

        # 2. Load & lock all products in one query (FOR UPDATE to prevent race conditions)
        product_ids = [item.product_id for item in payload.items]
        result = await self.db.scalars(
            sa.select(Product)
            .where(Product.id.in_(product_ids))
            .with_for_update()
        )
        products_by_id: dict[str, Product] = {p.id: p for p in result.all()}

        # 3. Validate stock for every item
        errors: list[str] = []
        for item in payload.items:
            if item.product_id not in products_by_id:
                errors.append(f"Product '{item.product_id}' not found.")
                continue
            product = products_by_id[item.product_id]
            if product.quantity < item.quantity:
                errors.append(
                    f"Insufficient stock for '{product.name}' (SKU: {product.sku}). "
                    f"Requested: {item.quantity}, Available: {product.quantity}."
                )

        if errors:
            raise InsufficientStockError("; ".join(errors))

        # 4. Calculate total
        total_amount = Decimal("0.00")
        for item in payload.items:
            product = products_by_id[item.product_id]
            subtotal = Decimal(str(product.price)) * item.quantity
            total_amount += subtotal

        # 5. Create Order
        order = Order(
            customer_id=payload.customer_id,
            total_amount=total_amount,
            status="pending",
        )
        self.db.add(order)
        await self.db.flush()  # Get order.id without committing

        # 6. Create OrderItems & reduce inventory
        for item in payload.items:
            product = products_by_id[item.product_id]
            unit_price = Decimal(str(product.price))
            subtotal = unit_price * item.quantity

            order_item = OrderItem(
                order_id=order.id,
                product_id=item.product_id,
                quantity=item.quantity,
                unit_price=unit_price,
                subtotal=subtotal,
            )
            self.db.add(order_item)
            product.quantity -= item.quantity

        await self.db.flush()
        await self.db.refresh(order)

        # Reload with items for response
        refreshed = await self.db.scalar(
            sa.select(Order)
            .where(Order.id == order.id)
            .options(selectinload(Order.items))
        )
        logger.info("Created order id=%s total=%s", order.id, total_amount)
        return refreshed  # type: ignore[return-value]

    async def list_orders(
        self,
        page: int = 1,
        limit: int = 10,
    ) -> OrderListResponse:
        """Return paginated order list, newest first."""
        count_query = sa.select(sa.func.count(Order.id))
        total = await self.db.scalar(count_query) or 0
        pages = math.ceil(total / limit) if total > 0 else 1
        offset = (page - 1) * limit

        result = await self.db.scalars(
            sa.select(Order)
            .options(selectinload(Order.items))
            .order_by(Order.created_at.desc())
            .offset(offset)
            .limit(limit)
        )
        orders = list(result.all())

        return OrderListResponse(
            items=[OrderResponse.model_validate(o) for o in orders],
            total=total,
            page=page,
            limit=limit,
            pages=pages,
        )

    async def get_by_id(self, order_id: str) -> Order:
        """Fetch a single order with its items."""
        order = await self.db.scalar(
            sa.select(Order)
            .where(Order.id == order_id)
            .options(selectinload(Order.items))
        )
        if not order:
            raise OrderNotFoundError(f"Order with id '{order_id}' not found.")
        return order

    async def delete(self, order_id: str) -> None:
        """Delete an order (items cascade)."""
        order = await self.get_by_id(order_id)
        await self.db.delete(order)
        logger.info("Deleted order id=%s", order_id)
