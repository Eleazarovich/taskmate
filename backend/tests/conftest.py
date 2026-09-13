"""Shared API test fixtures."""

import pytest
from fastapi.testclient import TestClient

from taskmate.main import app
from taskmate.store import InMemoryStore


@pytest.fixture
def client() -> TestClient:
    app.state.store = InMemoryStore()
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def bearer_client() -> TestClient:
    app.state.store = InMemoryStore()
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def logged_in(client: TestClient) -> tuple[TestClient, str]:
    response = client.post(
        "/auth/login",
        json={
            "email": "kasparov@chesskanban.app",
            "password": "KingMe2026!",
        },
    )
    assert response.status_code == 200
    return client, response.json()["accessToken"]

