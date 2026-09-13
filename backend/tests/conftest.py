"""Shared API test fixtures."""

import pytest
from fastapi.testclient import TestClient

from taskmate.main import app
from taskmate.store import DatabaseStore


@pytest.fixture
def store(tmp_path):
    database = DatabaseStore(database_url=f"sqlite:///{tmp_path / 'test.db'}")
    app.state.store = database
    yield database
    database.close()


@pytest.fixture
def client(store: DatabaseStore) -> TestClient:
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def bearer_client(store: DatabaseStore) -> TestClient:
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
