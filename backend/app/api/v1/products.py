from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.schemas.product import ProductCreate, ProductResponse, ProductUpdate, ok, err
from app.services.product_service import (
    ProductNotFoundError,
    ProductService,
    SKUAlreadyExistsError,
)

router = APIRouter(prefix="/products", tags=["Products"])


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_product(
    payload: ProductCreate,
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Create a new product."""
    service = ProductService(db)
    try:
        product = await service.create(payload)
        return ok("Product created successfully.", ProductResponse.model_validate(product).model_dump())
    except SKUAlreadyExistsError as exc:
        from fastapi import HTTPException
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc))


@router.get("")
async def list_products(
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(10, ge=1, le=100, description="Items per page"),
    search: str | None = Query(None, description="Search by name or SKU"),
    sort: str = Query("created_at", description="Sort column"),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Return paginated, searchable, sortable product list."""
    service = ProductService(db)
    result = await service.list_products(page=page, limit=limit, search=search, sort=sort)
    return ok("Products retrieved successfully.", result.model_dump())


@router.get("/{product_id}")
async def get_product(
    product_id: str,
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Retrieve a single product by ID."""
    service = ProductService(db)
    try:
        product = await service.get_by_id(product_id)
        return ok("Product retrieved successfully.", ProductResponse.model_validate(product).model_dump())
    except ProductNotFoundError as exc:
        from fastapi import HTTPException
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))


@router.put("/{product_id}")
async def update_product(
    product_id: str,
    payload: ProductUpdate,
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Update an existing product."""
    service = ProductService(db)
    try:
        product = await service.update(product_id, payload)
        return ok("Product updated successfully.", ProductResponse.model_validate(product).model_dump())
    except ProductNotFoundError as exc:
        from fastapi import HTTPException
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except SKUAlreadyExistsError as exc:
        from fastapi import HTTPException
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc))


@router.delete("/{product_id}", status_code=status.HTTP_200_OK)
async def delete_product(
    product_id: str,
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Delete a product by ID."""
    service = ProductService(db)
    try:
        await service.delete(product_id)
        return ok("Product deleted successfully.")
    except ProductNotFoundError as exc:
        from fastapi import HTTPException
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
