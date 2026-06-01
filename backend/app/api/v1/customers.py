from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.schemas.customer import CustomerCreate, CustomerResponse
from app.schemas.product import ok
from app.services.customer_service import (
    CustomerNotFoundError,
    CustomerService,
    EmailAlreadyExistsError,
)

router = APIRouter(prefix="/customers", tags=["Customers"])


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_customer(
    payload: CustomerCreate,
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Create a new customer."""
    service = CustomerService(db)
    try:
        customer = await service.create(payload)
        return ok("Customer created successfully.", CustomerResponse.model_validate(customer).model_dump())
    except EmailAlreadyExistsError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc))


@router.get("")
async def list_customers(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    search: str | None = Query(None, description="Search by name, email, or phone"),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Return paginated customer list."""
    service = CustomerService(db)
    result = await service.list_customers(page=page, limit=limit, search=search)
    return ok("Customers retrieved successfully.", result.model_dump())


@router.get("/{customer_id}")
async def get_customer(
    customer_id: str,
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Retrieve a single customer by ID."""
    service = CustomerService(db)
    try:
        customer = await service.get_by_id(customer_id)
        return ok("Customer retrieved successfully.", CustomerResponse.model_validate(customer).model_dump())
    except CustomerNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))


@router.delete("/{customer_id}", status_code=status.HTTP_200_OK)
async def delete_customer(
    customer_id: str,
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Delete a customer by ID."""
    service = CustomerService(db)
    try:
        await service.delete(customer_id)
        return ok("Customer deleted successfully.")
    except CustomerNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
