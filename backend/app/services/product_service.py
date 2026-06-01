import math
from typing import Any

import sqlalchemy as sa
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging import get_logger
from app.models.product import Product
from app.schemas.product import ProductCreate, ProductListResponse, ProductResponse, ProductUpdate

logger = get_logger(__name__)


class ProductNotFoundError(Exception):
    pass


class SKUAlreadyExistsError(Exception):
    pass


class ProductService:
    """Business logic for Product management."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def create(self, payload: ProductCreate) -> Product:
        """Create a new product, enforcing unique SKU."""
        existing = await self.db.scalar(
            sa.select(Product).where(Product.sku == payload.sku)
        )
        if existing:
            raise SKUAlreadyExistsError(f"A product with SKU '{payload.sku}' already exists.")

        product = Product(
            name=payload.name,
            sku=payload.sku,
            price=payload.price,
            quantity=payload.quantity,
        )
        self.db.add(product)
        await self.db.flush()
        await self.db.refresh(product)
        logger.info("Created product id=%s sku=%s", product.id, product.sku)
        return product

    async def list_products(
        self,
        page: int = 1,
        limit: int = 10,
        search: str | None = None,
        sort: str = "created_at",
    ) -> ProductListResponse:
        """Return paginated, searchable, sortable product list."""
        valid_sort_columns: dict[str, Any] = {
            "name": Product.name,
            "sku": Product.sku,
            "price": Product.price,
            "quantity": Product.quantity,
            "created_at": Product.created_at,
        }
        sort_col = valid_sort_columns.get(sort, Product.created_at)

        query = sa.select(Product)
        count_query = sa.select(sa.func.count(Product.id))

        if search:
            search_filter = sa.or_(
                Product.name.ilike(f"%{search}%"),
                Product.sku.ilike(f"%{search}%"),
            )
            query = query.where(search_filter)
            count_query = count_query.where(search_filter)

        total = await self.db.scalar(count_query) or 0
        pages = math.ceil(total / limit) if total > 0 else 1
        offset = (page - 1) * limit

        result = await self.db.scalars(
            query.order_by(sort_col).offset(offset).limit(limit)
        )
        products = list(result.all())

        return ProductListResponse(
            items=[ProductResponse.model_validate(p) for p in products],
            total=total,
            page=page,
            limit=limit,
            pages=pages,
        )

    async def get_by_id(self, product_id: str) -> Product:
        """Fetch a product by ID, raising ProductNotFoundError if missing."""
        product = await self.db.scalar(
            sa.select(Product).where(Product.id == product_id)
        )
        if not product:
            raise ProductNotFoundError(f"Product with id '{product_id}' not found.")
        return product

    async def update(self, product_id: str, payload: ProductUpdate) -> Product:
        """Update an existing product, enforcing SKU uniqueness on change."""
        product = await self.get_by_id(product_id)

        update_data = payload.model_dump(exclude_unset=True)

        if "sku" in update_data and update_data["sku"] != product.sku:
            existing = await self.db.scalar(
                sa.select(Product).where(
                    Product.sku == update_data["sku"],
                    Product.id != product_id,
                )
            )
            if existing:
                raise SKUAlreadyExistsError(
                    f"A product with SKU '{update_data['sku']}' already exists."
                )

        for field, value in update_data.items():
            setattr(product, field, value)

        await self.db.flush()
        await self.db.refresh(product)
        logger.info("Updated product id=%s", product_id)
        return product

    async def delete(self, product_id: str) -> None:
        """Delete a product by ID."""
        product = await self.get_by_id(product_id)
        await self.db.delete(product)
        logger.info("Deleted product id=%s", product_id)
