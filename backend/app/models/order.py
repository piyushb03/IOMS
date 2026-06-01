import uuid
from datetime import datetime
from decimal import Decimal

import sqlalchemy as sa
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base


class Order(Base):
    __tablename__ = "orders"

    id: Mapped[str] = mapped_column(
        sa.String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )
    customer_id: Mapped[str] = mapped_column(
        sa.String(36),
        sa.ForeignKey("customers.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    total_amount: Mapped[Decimal] = mapped_column(sa.Numeric(10, 2), nullable=False)
    status: Mapped[str] = mapped_column(
        sa.String(50),
        nullable=False,
        default="pending",
        index=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        sa.DateTime(timezone=True),
        server_default=sa.text("now()"),
        nullable=False,
    )

    # Relationships
    customer: Mapped["Customer"] = relationship(  # noqa: F821
        "Customer", back_populates="orders"
    )
    items: Mapped[list["OrderItem"]] = relationship(  # noqa: F821
        "OrderItem",
        back_populates="order",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<Order id={self.id} status={self.status} total={self.total_amount}>"
