import math

import sqlalchemy as sa
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging import get_logger
from app.models.customer import Customer
from app.schemas.customer import CustomerCreate, CustomerListResponse, CustomerResponse

logger = get_logger(__name__)


class CustomerNotFoundError(Exception):
    pass


class EmailAlreadyExistsError(Exception):
    pass


class CustomerService:
    """Business logic for Customer management."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def create(self, payload: CustomerCreate) -> Customer:
        """Create a new customer, enforcing unique email."""
        existing = await self.db.scalar(
            sa.select(Customer).where(Customer.email == str(payload.email).lower())
        )
        if existing:
            raise EmailAlreadyExistsError(
                f"A customer with email '{payload.email}' already exists."
            )

        customer = Customer(
            full_name=payload.full_name,
            email=str(payload.email).lower(),
            phone=payload.phone,
        )
        self.db.add(customer)
        await self.db.flush()
        await self.db.refresh(customer)
        logger.info("Created customer id=%s email=%s", customer.id, customer.email)
        return customer

    async def list_customers(
        self,
        page: int = 1,
        limit: int = 10,
        search: str | None = None,
    ) -> CustomerListResponse:
        """Return paginated, searchable customer list."""
        query = sa.select(Customer)
        count_query = sa.select(sa.func.count(Customer.id))

        if search:
            search_filter = sa.or_(
                Customer.full_name.ilike(f"%{search}%"),
                Customer.email.ilike(f"%{search}%"),
                Customer.phone.ilike(f"%{search}%"),
            )
            query = query.where(search_filter)
            count_query = count_query.where(search_filter)

        total = await self.db.scalar(count_query) or 0
        pages = math.ceil(total / limit) if total > 0 else 1
        offset = (page - 1) * limit

        result = await self.db.scalars(
            query.order_by(Customer.created_at.desc()).offset(offset).limit(limit)
        )
        customers = list(result.all())

        return CustomerListResponse(
            items=[CustomerResponse.model_validate(c) for c in customers],
            total=total,
            page=page,
            limit=limit,
            pages=pages,
        )

    async def get_by_id(self, customer_id: str) -> Customer:
        """Fetch a customer by ID."""
        customer = await self.db.scalar(
            sa.select(Customer).where(Customer.id == customer_id)
        )
        if not customer:
            raise CustomerNotFoundError(f"Customer with id '{customer_id}' not found.")
        return customer

    async def delete(self, customer_id: str) -> None:
        """Delete a customer by ID."""
        customer = await self.get_by_id(customer_id)
        await self.db.delete(customer)
        logger.info("Deleted customer id=%s", customer_id)
