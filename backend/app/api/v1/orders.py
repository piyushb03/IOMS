from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.schemas.order import OrderCreate, OrderResponse
from app.schemas.product import ok
from app.services.order_service import (
    CustomerNotFoundError,
    InsufficientStockError,
    OrderNotFoundError,
    OrderService,
)

router = APIRouter(prefix="/orders", tags=["Orders"])


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_order(
    payload: OrderCreate,
    db: AsyncSession = Depends(get_db),
) -> dict:
    """
    Create a new order.

    Atomically validates stock, calculates totals, creates the order and items,
    and reduces product inventory — all within a single database transaction.
    """
    service = OrderService(db)
    try:
        order = await service.create(payload)
        return ok("Order created successfully.", OrderResponse.model_validate(order).model_dump())
    except CustomerNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except InsufficientStockError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))


@router.get("")
async def list_orders(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Return paginated order list, newest first."""
    service = OrderService(db)
    result = await service.list_orders(page=page, limit=limit)
    return ok("Orders retrieved successfully.", result.model_dump())


@router.get("/{order_id}")
async def get_order(
    order_id: str,
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Retrieve a single order with its items."""
    service = OrderService(db)
    try:
        order = await service.get_by_id(order_id)
        return ok("Order retrieved successfully.", OrderResponse.model_validate(order).model_dump())
    except OrderNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))


@router.delete("/{order_id}", status_code=status.HTTP_200_OK)
async def delete_order(
    order_id: str,
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Delete an order (cascade deletes its items)."""
    service = OrderService(db)
    try:
        await service.delete(order_id)
        return ok("Order deleted successfully.")
    except OrderNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
