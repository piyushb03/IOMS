from datetime import datetime
from decimal import Decimal
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, field_validator


class ProductBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, description="Product display name")
    sku: str = Field(..., min_length=1, max_length=100, description="Stock Keeping Unit — must be unique")
    price: Decimal = Field(..., ge=0, decimal_places=2, description="Unit price (non-negative)")
    quantity: int = Field(..., ge=0, description="Current stock quantity (non-negative)")

    @field_validator("name")
    @classmethod
    def name_must_not_be_blank(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Product name must not be blank.")
        return v.strip()

    @field_validator("sku")
    @classmethod
    def sku_must_not_be_blank(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("SKU must not be blank.")
        return v.strip().upper()


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=255)
    sku: str | None = Field(None, min_length=1, max_length=100)
    price: Decimal | None = Field(None, ge=0, decimal_places=2)
    quantity: int | None = Field(None, ge=0)

    @field_validator("name")
    @classmethod
    def name_must_not_be_blank(cls, v: str | None) -> str | None:
        if v is not None and not v.strip():
            raise ValueError("Product name must not be blank.")
        return v.strip() if v else v

    @field_validator("sku")
    @classmethod
    def sku_must_not_be_blank(cls, v: str | None) -> str | None:
        if v is not None and not v.strip():
            raise ValueError("SKU must not be blank.")
        return v.strip().upper() if v else v


class ProductResponse(ProductBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    created_at: datetime
    updated_at: datetime


class ProductListResponse(BaseModel):
    items: list[ProductResponse]
    total: int
    page: int
    limit: int
    pages: int


# ---- Standardised API envelope ----

class APIResponse(BaseModel):
    success: bool
    message: str
    data: Any = None


def ok(message: str, data: Any = None) -> dict[str, Any]:
    return {"success": True, "message": message, "data": data}


def err(message: str) -> dict[str, Any]:
    return {"success": False, "message": message}
