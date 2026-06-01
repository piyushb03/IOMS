"""Tests for /api/v1/customers endpoints."""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_customer(client: AsyncClient):
    response = await client.post(
        "/api/v1/customers",
        json={"full_name": "Alice Johnson", "email": "alice@example.com", "phone": "+1-555-0100"},
    )
    assert response.status_code == 201
    body = response.json()
    assert body["success"] is True
    assert body["data"]["email"] == "alice@example.com"


@pytest.mark.asyncio
async def test_create_customer_duplicate_email(client: AsyncClient):
    await client.post(
        "/api/v1/customers",
        json={"full_name": "Bob Smith", "email": "bob.dup@example.com"},
    )
    response = await client.post(
        "/api/v1/customers",
        json={"full_name": "Bob Smith 2", "email": "bob.dup@example.com"},
    )
    assert response.status_code == 409


@pytest.mark.asyncio
async def test_create_customer_invalid_email(client: AsyncClient):
    response = await client.post(
        "/api/v1/customers",
        json={"full_name": "Invalid Email", "email": "not-an-email"},
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_list_customers(client: AsyncClient):
    await client.post(
        "/api/v1/customers",
        json={"full_name": "Carol Williams", "email": "carol.list@example.com"},
    )
    response = await client.get("/api/v1/customers")
    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert "items" in body["data"]
    assert body["data"]["total"] >= 1


@pytest.mark.asyncio
async def test_get_customer_by_id(client: AsyncClient):
    create = await client.post(
        "/api/v1/customers",
        json={"full_name": "Dave Brown", "email": "dave@example.com"},
    )
    customer_id = create.json()["data"]["id"]
    response = await client.get(f"/api/v1/customers/{customer_id}")
    assert response.status_code == 200
    assert response.json()["data"]["id"] == customer_id


@pytest.mark.asyncio
async def test_get_customer_not_found(client: AsyncClient):
    response = await client.get("/api/v1/customers/nonexistent-customer-id")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_delete_customer(client: AsyncClient):
    create = await client.post(
        "/api/v1/customers",
        json={"full_name": "Eve Delete", "email": "eve.delete@example.com"},
    )
    customer_id = create.json()["data"]["id"]
    response = await client.delete(f"/api/v1/customers/{customer_id}")
    assert response.status_code == 200
    get = await client.get(f"/api/v1/customers/{customer_id}")
    assert get.status_code == 404


@pytest.mark.asyncio
async def test_search_customers(client: AsyncClient):
    await client.post(
        "/api/v1/customers",
        json={"full_name": "Unique SearchPerson", "email": "unique.search@example.com"},
    )
    response = await client.get("/api/v1/customers?search=SearchPerson")
    assert response.status_code == 200
    body = response.json()
    assert any("SearchPerson" in item["full_name"] for item in body["data"]["items"])
