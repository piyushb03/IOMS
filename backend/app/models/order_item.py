import uuid
from decimal import Decimal

import sqlalchemy as sa
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base


class OrderItem(Base):
    __tablename__ = "order_items"

    id: Mapped[str] = mapped_column(
        sa.String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )
    order_id: Mapped[str] = mapped_column(
        sa.String(36),
        sa.ForeignKey("orders.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    product_id: Mapped[str] = mapped_column(
        sa.String(36),
        sa.ForeignKey("products.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    quantity: Mapped[int] = mapped_column(sa.Integer, nullable=False)
    unit_price: Mapped[Decimal] = mapped_column(sa.Numeric(10, 2), nullable=False)
    subtotal: Mapped[Decimal] = mapped_column(sa.Numeric(10, 2), nullable=False)

    # Relationships
    order: Mapped["Order"] = relationship("Order", back_populates="items")  # noqa: F821
    product: Mapped["Product"] = relationship("Product", back_populates="order_items")  # noqa: F821

    def __repr__(self) -> str:
        return (
            f"<OrderItem id={self.id} order_id={self.order_id} "
            f"product_id={self.product_id} qty={self.quantity}>"
        )
