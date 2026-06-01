"""Tests for /api/v1/products endpoints."""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_product(client: AsyncClient):
    response = await client.post(
        "/api/v1/products",
        json={"name": "Widget Pro", "sku": "WGT-001", "price": "29.99", "quantity": 100},
    )
    assert response.status_code == 201
    body = response.json()
    assert body["success"] is True
    assert body["data"]["sku"] == "WGT-001"
    assert body["data"]["quantity"] == 100


@pytest.mark.asyncio
async def test_create_product_duplicate_sku(client: AsyncClient):
    await client.post(
        "/api/v1/products",
        json={"name": "Widget A", "sku": "DUPE-SKU", "price": "10.00", "quantity": 5},
    )
    response = await client.post(
        "/api/v1/products",
        json={"name": "Widget B", "sku": "DUPE-SKU", "price": "15.00", "quantity": 3},
    )
    assert response.status_code == 409


@pytest.mark.asyncio
async def test_create_product_negative_price(client: AsyncClient):
    response = await client.post(
        "/api/v1/products",
        json={"name": "Bad Price", "sku": "NEG-PRICE", "price": "-5.00", "quantity": 10},
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_create_product_negative_quantity(client: AsyncClient):
    response = await client.post(
        "/api/v1/products",
        json={"name": "Bad Qty", "sku": "NEG-QTY", "price": "10.00", "quantity": -1},
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_list_products(client: AsyncClient):
    await client.post(
        "/api/v1/products",
        json={"name": "List Widget", "sku": "LIST-001", "price": "9.99", "quantity": 20},
    )
    response = await client.get("/api/v1/products")
    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert "items" in body["data"]
    assert body["data"]["total"] >= 1


@pytest.mark.asyncio
async def test_list_products_search(client: AsyncClient):
    await client.post(
        "/api/v1/products",
        json={"name": "Searchable Gizmo", "sku": "SRH-001", "price": "5.00", "quantity": 10},
    )
    response = await client.get("/api/v1/products?search=Searchable")
    assert response.status_code == 200
    body = response.json()
    assert body["data"]["total"] >= 1
    assert any("Searchable" in item["name"] for item in body["data"]["items"])


@pytest.mark.asyncio
async def test_get_product_by_id(client: AsyncClient):
    create = await client.post(
        "/api/v1/products",
        json={"name": "Get Me", "sku": "GET-001", "price": "19.99", "quantity": 50},
    )
    product_id = create.json()["data"]["id"]
    response = await client.get(f"/api/v1/products/{product_id}")
    assert response.status_code == 200
    assert response.json()["data"]["id"] == product_id


@pytest.mark.asyncio
async def test_get_product_not_found(client: AsyncClient):
    response = await client.get("/api/v1/products/nonexistent-id-12345")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_update_product(client: AsyncClient):
    create = await client.post(
        "/api/v1/products",
        json={"name": "Update Me", "sku": "UPD-001", "price": "10.00", "quantity": 5},
    )
    product_id = create.json()["data"]["id"]
    response = await client.put(
        f"/api/v1/products/{product_id}",
        json={"name": "Updated Name", "price": "15.00"},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["data"]["name"] == "Updated Name"
    assert float(body["data"]["price"]) == 15.00


@pytest.mark.asyncio
async def test_delete_product(client: AsyncClient):
    create = await client.post(
        "/api/v1/products",
        json={"name": "Delete Me", "sku": "DEL-001", "price": "1.00", "quantity": 1},
    )
    product_id = create.json()["data"]["id"]
    response = await client.delete(f"/api/v1/products/{product_id}")
    assert response.status_code == 200
    get = await client.get(f"/api/v1/products/{product_id}")
    assert get.status_code == 404


@pytest.mark.asyncio
async def test_health_check(client: AsyncClient):
    response = await client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"
