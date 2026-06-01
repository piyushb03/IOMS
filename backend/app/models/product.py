import uuid
from datetime import datetime

import sqlalchemy as sa
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base


class Product(Base):
    __tablename__ = "products"

    id: Mapped[str] = mapped_column(
        sa.String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )
    name: Mapped[str] = mapped_column(sa.String(255), nullable=False, index=True)
    sku: Mapped[str] = mapped_column(sa.String(100), nullable=False, unique=True, index=True)
    price: Mapped[float] = mapped_column(sa.Numeric(10, 2), nullable=False)
    quantity: Mapped[int] = mapped_column(sa.Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(
        sa.DateTime(timezone=True),
        server_default=sa.text("now()"),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        sa.DateTime(timezone=True),
        server_default=sa.text("now()"),
        onupdate=datetime.utcnow,
        nullable=False,
    )

    # Relationships
    order_items: Mapped[list["OrderItem"]] = relationship(  # noqa: F821
        "OrderItem", back_populates="product"
    )

    def __repr__(self) -> str:
        return f"<Product id={self.id} sku={self.sku} name={self.name!r}>"
