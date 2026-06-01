import uuid
from datetime import datetime

import sqlalchemy as sa
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base


class Customer(Base):
    __tablename__ = "customers"

    id: Mapped[str] = mapped_column(
        sa.String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )
    full_name: Mapped[str] = mapped_column(sa.String(255), nullable=False)
    email: Mapped[str] = mapped_column(sa.String(255), nullable=False, unique=True, index=True)
    phone: Mapped[str | None] = mapped_column(sa.String(50), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        sa.DateTime(timezone=True),
        server_default=sa.text("now()"),
        nullable=False,
    )

    # Relationships
    orders: Mapped[list["Order"]] = relationship(  # noqa: F821
        "Order", back_populates="customer"
    )

    def __repr__(self) -> str:
        return f"<Customer id={self.id} email={self.email!r}>"
