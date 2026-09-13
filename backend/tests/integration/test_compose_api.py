"""High-value API journeys against the built app and Postgres containers."""

from __future__ import annotations

import httpx
import pytest


pytestmark = pytest.mark.integration


def login(client: httpx.Client, email: str, password: str) -> str:
    response = client.post(
        "/auth/login", json={"email": email, "password": password}
    )
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["success"] is True
    return body["accessToken"]


def create_board(client: httpx.Client, name: str = "Integration board") -> str:
    response = client.post("/boards", json={"name": name})
    assert response.status_code == 201, response.text
    return response.json()["id"]


def create_task(client: httpx.Client, board_id: str, title: str) -> dict:
    response = client.post(
        f"/boards/{board_id}/tasks",
        json={
            "title": title,
            "description": "Created through the Compose integration suite.",
            "priority": "high",
            "dueDate": "2026-12-31",
            "tags": ["integration", "postgres"],
        },
    )
    assert response.status_code == 201, response.text
    return response.json()


def test_compose_serves_frontend_and_public_api(client: httpx.Client) -> None:
    frontend = client.get("/")
    assert frontend.status_code == 200
    assert "text/html" in frontend.headers["content-type"]

    unauthenticated_me = client.get("/auth/me")
    assert unauthenticated_me.status_code == 200
    assert unauthenticated_me.json() is None


def test_postgres_startup_seeds_demo_account_and_boards(client: httpx.Client) -> None:
    token = login(client, "kasparov@chesskanban.app", "KingMe2026!")

    boards = client.get("/boards")
    assert boards.status_code == 200
    board_ids = {board["id"] for board in boards.json()}
    assert {"board-001", "board-002", "board-003"} <= board_ids

    tasks = client.get("/boards/board-001/tasks")
    assert tasks.status_code == 200
    assert {task["id"] for task in tasks.json()} >= {
        "task-001",
        "task-004",
        "task-008",
    }

    bearer_client = httpx.Client(
        base_url=client.base_url,
        headers={"Authorization": f"Bearer {token}"},
        timeout=15.0,
    )
    try:
        me = bearer_client.get("/auth/me")
        assert me.status_code == 200
        assert me.json()["email"] == "kasparov@chesskanban.app"
    finally:
        bearer_client.close()


def test_signup_cookie_bearer_and_logout_invalidate_a_session(
    client: httpx.Client, new_user: dict[str, str]
) -> None:
    me = client.get("/auth/me")
    assert me.status_code == 200
    assert me.json()["email"] == new_user["email"]

    bearer_client = httpx.Client(
        base_url=client.base_url,
        headers={"Authorization": f"Bearer {new_user['access_token']}"},
        timeout=15.0,
    )
    try:
        assert bearer_client.get("/boards").status_code == 200
        assert client.post("/auth/logout").status_code == 204
        assert client.get("/boards").status_code == 401
        assert bearer_client.get("/boards").status_code == 401
    finally:
        bearer_client.close()


def test_user_resources_are_isolated_and_board_delete_cascades(
    client: httpx.Client, new_user: dict[str, str]
) -> None:
    board_id = create_board(client)
    task = create_task(client, board_id, "Isolation task")

    other_client = httpx.Client(base_url=client.base_url, timeout=15.0)
    try:
        other_user = {
            "name": "Second Integration Tester",
            "email": f"other-{new_user['email']}",
            "password": "correct-horse-battery-staple",
        }
        signup = other_client.post("/auth/signup", json=other_user)
        assert signup.status_code == 200, signup.text

        assert other_client.get(f"/boards/{board_id}/tasks").status_code == 404
        assert other_client.patch(
            f"/tasks/{task['id']}", json={"title": "Should stay private"}
        ).status_code == 404
        assert other_client.delete(f"/boards/{board_id}").status_code == 404
    finally:
        other_client.close()

    assert client.delete(f"/boards/{board_id}").status_code == 204
    assert client.get(f"/boards/{board_id}/tasks").status_code == 404
    assert client.patch(
        f"/tasks/{task['id']}", json={"title": "Deleted task"}
    ).status_code == 404


def test_task_crud_reorder_and_adjacent_moves_update_stats(
    client: httpx.Client, new_user: dict[str, str]
) -> None:
    board_id = create_board(client, "Workflow board")
    first_task = create_task(client, board_id, "First workflow task")
    second_task = create_task(client, board_id, "Second workflow task")

    tasks = client.get(f"/boards/{board_id}/tasks")
    assert [task["id"] for task in tasks.json()] == [
        first_task["id"],
        second_task["id"],
    ]
    assert first_task["position"] == 0
    assert second_task["position"] == 1

    updated = client.patch(
        f"/tasks/{first_task['id']}",
        json={"title": "Updated workflow task", "priority": "critical"},
    )
    assert updated.status_code == 200
    assert updated.json()["title"] == "Updated workflow task"
    assert updated.json()["priority"] == "critical"

    assert client.patch(
        f"/tasks/{first_task['id']}/reorder", json={"newPosition": 1}
    ).status_code == 204
    reordered = client.get(f"/boards/{board_id}/tasks")
    assert [task["id"] for task in reordered.json()] == [
        second_task["id"],
        first_task["id"],
    ]

    move = client.patch(
        f"/tasks/{first_task['id']}/move",
        json={"toStage": "knight", "newPosition": 0},
    )
    assert move.status_code == 200
    assert move.json() == {
        "success": True,
        "ratingDelta": 1,
        "isVictory": False,
        "newRating": 1,
    }

    invalid = client.patch(
        f"/tasks/{first_task['id']}/move",
        json={"toStage": "rook", "newPosition": 0},
    )
    assert invalid.status_code == 200
    assert invalid.json()["success"] is False
    assert invalid.json()["ratingDelta"] == 0
    assert invalid.json()["newRating"] == 1

    backward = client.patch(
        f"/tasks/{first_task['id']}/move",
        json={"toStage": "pawn", "newPosition": 0},
    )
    assert backward.status_code == 200
    assert backward.json()["ratingDelta"] == -1
    assert backward.json()["newRating"] == 0

    persisted = client.get(f"/boards/{board_id}/tasks")
    persisted_task = next(
        task for task in persisted.json() if task["id"] == first_task["id"]
    )
    assert persisted_task["stage"] == "pawn"
    assert persisted_task["title"] == "Updated workflow task"

    stats = client.get("/player/stats")
    assert stats.status_code == 200
    assert stats.json()["user"]["rating"] == 0
    assert stats.json()["totalBoards"] == 1
    assert stats.json()["tasksByStage"]["pawn"] == 2
    assert stats.json()["recentMoves"][0]["toStage"] == "pawn"


def test_full_workflow_reaches_king_and_reports_victory(
    client: httpx.Client, new_user: dict[str, str]
) -> None:
    board_id = create_board(client, "Victory board")
    task = create_task(client, board_id, "Complete the workflow")

    rating = 0
    stages = ["knight", "bishop", "rook", "queen", "king"]
    for expected_rating, stage in enumerate(stages, start=1):
        response = client.patch(
            f"/tasks/{task['id']}/move",
            json={"toStage": stage, "newPosition": 0},
        )
        assert response.status_code == 200, response.text
        body = response.json()
        rating += 1
        assert body == {
            "success": True,
            "ratingDelta": 1,
            "isVictory": stage == "king",
            "newRating": expected_rating,
        }

    tasks = client.get(f"/boards/{board_id}/tasks")
    assert tasks.status_code == 200
    assert tasks.json()[0]["stage"] == "king"

    stats = client.get("/player/stats")
    assert stats.status_code == 200
    assert stats.json()["user"]["rating"] == rating
    assert stats.json()["totalCompleted"] == 1
    assert stats.json()["tasksByStage"]["king"] == 1
