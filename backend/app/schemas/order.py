from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


class OrderItemCreate(BaseModel):
    product_id: str = Field(..., description="UUID of the product to order")
    quantity: int = Field(..., gt=0, description="Quantity must be greater than zero")

    @field_validator("product_id")
    @classmethod
    def product_id_must_not_be_blank(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("product_id must not be blank.")
        return v.strip()


class OrderCreate(BaseModel):
    customer_id: str = Field(..., description="UUID of the customer placing the order")
    items: list[OrderItemCreate] = Field(..., min_length=1, description="At least one item required")

    @field_validator("customer_id")
    @classmethod
    def customer_id_must_not_be_blank(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("customer_id must not be blank.")
        return v.strip()

    @model_validator(mode="after")
    def items_must_not_be_empty(self) -> "OrderCreate":
        if not self.items:
            raise ValueError("Order must contain at least one item.")
        # Ensure no duplicate product IDs in a single order
        product_ids = [item.product_id for item in self.items]
        if len(product_ids) != len(set(product_ids)):
            raise ValueError("Duplicate product IDs detected in order items. Combine quantities instead.")
        return self


class OrderItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    product_id: str
    quantity: int
    unit_price: Decimal
    subtotal: Decimal


class OrderResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    customer_id: str
    total_amount: Decimal
    status: str
    created_at: datetime
    items: list[OrderItemResponse] = []


class OrderListResponse(BaseModel):
    items: list[OrderResponse]
    total: int
    page: int
    limit: int
    pages: int
