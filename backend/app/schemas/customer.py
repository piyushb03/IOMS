from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


class CustomerBase(BaseModel):
    full_name: str = Field(..., min_length=1, max_length=255, description="Customer full name")
    email: EmailStr = Field(..., description="Customer email — must be unique")
    phone: str | None = Field(None, max_length=50, description="Optional phone number")

    @field_validator("full_name")
    @classmethod
    def name_must_not_be_blank(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Full name must not be blank.")
        return v.strip()


class CustomerCreate(CustomerBase):
    pass


class CustomerResponse(CustomerBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    created_at: datetime


class CustomerListResponse(BaseModel):
    items: list[CustomerResponse]
    total: int
    page: int
    limit: int
    pages: int
