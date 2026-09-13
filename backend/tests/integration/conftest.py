"""Fixtures for tests that call a running Docker Compose API."""

from __future__ import annotations

import os
from collections.abc import Iterator
from uuid import uuid4

import httpx
import pytest


@pytest.fixture(scope="session")
def api_url() -> str:
    return os.getenv("TASKMATE_API_URL", "http://127.0.0.1:8000").rstrip("/")


@pytest.fixture
def client(api_url: str) -> Iterator[httpx.Client]:
    with httpx.Client(base_url=api_url, timeout=15.0) as http_client:
        yield http_client


@pytest.fixture
def new_user(client: httpx.Client) -> dict[str, str]:
    suffix = uuid4().hex
    credentials = {
        "name": "Integration Tester",
        "email": f"integration-{suffix}@example.com",
        "password": "correct-horse-battery-staple",
    }
    response = client.post("/auth/signup", json=credentials)
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["success"] is True
    assert body["accessToken"]
    return credentials | {"access_token": body["accessToken"]}
