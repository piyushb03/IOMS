"""Tests for /api/v1/orders endpoints — including inventory business rules."""
import pytest
from httpx import AsyncClient


async def _create_customer(client: AsyncClient, email: str) -> str:
    r = await client.post(
        "/api/v1/customers",
        json={"full_name": "Test Customer", "email": email},
    )
    assert r.status_code == 201
    return r.json()["data"]["id"]


async def _create_product(client: AsyncClient, sku: str, qty: int, price: str = "10.00") -> str:
    r = await client.post(
        "/api/v1/products",
        json={"name": f"Product {sku}", "sku": sku, "price": price, "quantity": qty},
    )
    assert r.status_code == 201
    return r.json()["data"]["id"]


@pytest.mark.asyncio
async def test_create_order_success(client: AsyncClient):
    customer_id = await _create_customer(client, "order.test1@example.com")
    product_id = await _create_product(client, "ORD-P001", 50, "25.00")

    response = await client.post(
        "/api/v1/orders",
        json={"customer_id": customer_id, "items": [{"product_id": product_id, "quantity": 3}]},
    )
    assert response.status_code == 201
    body = response.json()
    assert body["success"] is True
    assert float(body["data"]["total_amount"]) == 75.00
    assert body["data"]["status"] == "pending"
    assert len(body["data"]["items"]) == 1


@pytest.mark.asyncio
async def test_order_reduces_inventory(client: AsyncClient):
    customer_id = await _create_customer(client, "inventory.test@example.com")
    product_id = await _create_product(client, "INV-P001", 20, "10.00")

    await client.post(
        "/api/v1/orders",
        json={"customer_id": customer_id, "items": [{"product_id": product_id, "quantity": 5}]},
    )

    product_response = await client.get(f"/api/v1/products/{product_id}")
    assert product_response.json()["data"]["quantity"] == 15


@pytest.mark.asyncio
async def test_order_insufficient_stock(client: AsyncClient):
    customer_id = await _create_customer(client, "nostock.test@example.com")
    product_id = await _create_product(client, "NST-P001", 2, "10.00")

    response = await client.post(
        "/api/v1/orders",
        json={"customer_id": customer_id, "items": [{"product_id": product_id, "quantity": 10}]},
    )
    assert response.status_code == 400
    assert response.json()["success"] is False


@pytest.mark.asyncio
async def test_order_zero_quantity_rejected(client: AsyncClient):
    customer_id = await _create_customer(client, "zerqty.test@example.com")
    product_id = await _create_product(client, "ZQT-P001", 10, "10.00")

    response = await client.post(
        "/api/v1/orders",
        json={"customer_id": customer_id, "items": [{"product_id": product_id, "quantity": 0}]},
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_order_invalid_customer(client: AsyncClient):
    product_id = await _create_product(client, "INV-CUST-P001", 10)

    response = await client.post(
        "/api/v1/orders",
        json={
            "customer_id": "nonexistent-customer-uuid",
            "items": [{"product_id": product_id, "quantity": 1}],
        },
    )
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_order_invalid_product(client: AsyncClient):
    customer_id = await _create_customer(client, "inv.prod.test@example.com")

    response = await client.post(
        "/api/v1/orders",
        json={
            "customer_id": customer_id,
            "items": [{"product_id": "nonexistent-product-uuid", "quantity": 1}],
        },
    )
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_order_duplicate_product_ids_rejected(client: AsyncClient):
    customer_id = await _create_customer(client, "dup.prod.test@example.com")
    product_id = await _create_product(client, "DUP-PROD-001", 100)

    response = await client.post(
        "/api/v1/orders",
        json={
            "customer_id": customer_id,
            "items": [
                {"product_id": product_id, "quantity": 2},
                {"product_id": product_id, "quantity": 3},
            ],
        },
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_list_orders(client: AsyncClient):
    response = await client.get("/api/v1/orders")
    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert "items" in body["data"]


@pytest.mark.asyncio
async def test_get_order_by_id(client: AsyncClient):
    customer_id = await _create_customer(client, "getorder.test@example.com")
    product_id = await _create_product(client, "GET-ORD-001", 10)

    create = await client.post(
        "/api/v1/orders",
        json={"customer_id": customer_id, "items": [{"product_id": product_id, "quantity": 1}]},
    )
    order_id = create.json()["data"]["id"]
    response = await client.get(f"/api/v1/orders/{order_id}")
    assert response.status_code == 200
    assert response.json()["data"]["id"] == order_id


@pytest.mark.asyncio
async def test_delete_order(client: AsyncClient):
    customer_id = await _create_customer(client, "delorder.test@example.com")
    product_id = await _create_product(client, "DEL-ORD-001", 10)

    create = await client.post(
        "/api/v1/orders",
        json={"customer_id": customer_id, "items": [{"product_id": product_id, "quantity": 1}]},
    )
    order_id = create.json()["data"]["id"]
    response = await client.delete(f"/api/v1/orders/{order_id}")
    assert response.status_code == 200
    get = await client.get(f"/api/v1/orders/{order_id}")
    assert get.status_code == 404


@pytest.mark.asyncio
async def test_dashboard_summary(client: AsyncClient):
    response = await client.get("/api/v1/dashboard/summary")
    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    data = body["data"]
    assert "total_products" in data
    assert "total_customers" in data
    assert "total_orders" in data
    assert "low_stock_products" in data
