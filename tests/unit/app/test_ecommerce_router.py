from fastapi import FastAPI
from fastapi.testclient import TestClient

from copaw.app.routers.ecommerce import router


def _build_client() -> TestClient:
    app = FastAPI()
    app.include_router(router)
    return TestClient(app)


def test_search_products_returns_not_implemented() -> None:
    client = _build_client()

    response = client.get("/ecommerce/products/search", params={"keyword": "desk"})

    assert response.status_code == 501
    assert "mock data" in response.json()["detail"]


def test_get_competitors_returns_not_implemented() -> None:
    client = _build_client()

    response = client.get("/ecommerce/competitors", params={"asin": "B001234567"})

    assert response.status_code == 501


def test_analyze_keywords_returns_not_implemented() -> None:
    client = _build_client()

    response = client.get(
        "/ecommerce/keywords/analyze",
        params={"seed_keyword": "mouse"},
    )

    assert response.status_code == 501


def test_get_suppliers_returns_not_implemented() -> None:
    client = _build_client()

    response = client.get("/ecommerce/suppliers", params={"category": "office"})

    assert response.status_code == 501


def test_get_product_details_returns_not_implemented() -> None:
    client = _build_client()

    response = client.get("/ecommerce/products/B001234567/details")

    assert response.status_code == 501
