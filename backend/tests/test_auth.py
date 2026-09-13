from fastapi.testclient import TestClient

from taskmate.main import app


def test_me_is_public_but_protected_resources_require_auth(client: TestClient) -> None:
    assert client.get("/auth/me").json() is None
    response = client.get("/boards")
    assert response.status_code == 401
    assert response.json() == {"error": "Authentication required."}


def test_seeded_login_sets_cookie_and_returns_bearer_token(client: TestClient) -> None:
    response = client.post(
        "/auth/login",
        json={
            "email": "kasparov@chesskanban.app",
            "password": "KingMe2026!",
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert body["user"]["email"] == "kasparov@chesskanban.app"
    assert body["accessToken"]
    assert "taskmate_session=" in response.headers["set-cookie"]

    seeded_record = app.state.store.users["user-001"]
    assert seeded_record.password_hash != "KingMe2026!"
    assert "KingMe2026!" not in seeded_record.password_hash


def test_bearer_token_authenticates_without_cookie(
    client: TestClient, bearer_client: TestClient
) -> None:
    login = client.post(
        "/auth/login",
        json={
            "email": "kasparov@chesskanban.app",
            "password": "KingMe2026!",
        },
    )
    token = login.json()["accessToken"]

    response = bearer_client.get(
        "/boards", headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    assert len(response.json()) == 3


def test_invalid_login_and_duplicate_signup(client: TestClient) -> None:
    invalid = client.post(
        "/auth/login",
        json={"email": "kasparov@chesskanban.app", "password": "wrong-password"},
    )
    assert invalid.status_code == 401
    assert invalid.json() == {"success": False, "error": "Invalid credentials."}

    duplicate = client.post(
        "/auth/signup",
        json={
            "name": "Another User",
            "email": "KASPAROV@chesskanban.app",
            "password": "correct-horse",
        },
    )
    assert duplicate.status_code == 409
    assert duplicate.json()["success"] is False


def test_signup_creates_hashed_account_with_no_seeded_boards(client: TestClient) -> None:
    response = client.post(
        "/auth/signup",
        json={
            "name": "Ada Lovelace",
            "email": "ada@example.com",
            "password": "correct-horse",
        },
    )
    assert response.status_code == 200
    user_id = response.json()["user"]["id"]
    assert response.json()["user"]["rating"] == 0
    assert client.get("/boards").json() == []
    assert app.state.store.users[user_id].password_hash != "correct-horse"


def test_logout_revokes_both_cookie_and_bearer_token(
    client: TestClient, bearer_client: TestClient
) -> None:
    login = client.post(
        "/auth/login",
        json={
            "email": "kasparov@chesskanban.app",
            "password": "KingMe2026!",
        },
    )
    token = login.json()["accessToken"]
    assert client.post("/auth/logout").status_code == 204
    assert client.get("/boards").status_code == 401
    assert (
        bearer_client.get(
            "/boards", headers={"Authorization": f"Bearer {token}"}
        ).status_code
        == 401
    )
