from fastapi.testclient import TestClient


def test_seeded_boards_and_tasks_are_available(logged_in: tuple[TestClient, str]) -> None:
    client, _ = logged_in
    boards = client.get("/boards")
    assert boards.status_code == 200
    assert [board["id"] for board in boards.json()] == [
        "board-001",
        "board-002",
        "board-003",
    ]

    tasks = client.get("/boards/board-001/tasks")
    assert tasks.status_code == 200
    assert len(tasks.json()) == 8
    assert tasks.json()[0]["stage"] == "pawn"
    assert tasks.json()[0]["position"] == 0


def test_board_and_task_crud(client: TestClient) -> None:
    client.post(
        "/auth/signup",
        json={"name": "Ada Lovelace", "email": "ada@example.com", "password": "correct-horse"},
    )

    board_response = client.post("/boards", json={"name": "New Ideas"})
    assert board_response.status_code == 201
    board_id = board_response.json()["id"]

    task_response = client.post(
        f"/boards/{board_id}/tasks",
        json={
            "title": "Write a compiler",
            "description": "Start with a parser.",
            "priority": "high",
            "dueDate": "2026-10-01",
            "tags": ["Learning", "Build"],
        },
    )
    assert task_response.status_code == 201
    task = task_response.json()
    assert task["stage"] == "pawn"
    assert task["position"] == 0
    assert task["dueDate"] == "2026-10-01"

    updated = client.patch(
        f"/tasks/{task['id']}",
        json={"title": "Write a compiler", "tags": ["Learning", "Compiler"]},
    )
    assert updated.status_code == 200
    assert updated.json()["tags"] == ["Learning", "Compiler"]

    assert client.patch(
        f"/tasks/{task['id']}/reorder", json={"newPosition": 4}
    ).status_code == 204
    assert client.delete(f"/tasks/{task['id']}").status_code == 204
    assert client.delete(f"/boards/{board_id}").status_code == 204
    assert client.get(f"/boards/{board_id}/tasks").status_code == 404


def test_resources_are_isolated_by_user(client: TestClient) -> None:
    client.post(
        "/auth/signup",
        json={"name": "Ada Lovelace", "email": "ada@example.com", "password": "correct-horse"},
    )
    assert client.get("/boards/board-001/tasks").status_code == 404
    assert client.patch("/tasks/task-001", json={"title": "Stolen task"}).status_code == 404
    assert client.delete("/boards/board-001").status_code == 404


def test_validation_errors_use_the_openapi_error_shape(client: TestClient) -> None:
    response = client.post("/auth/signup", json={"name": "A", "email": "bad", "password": "short"})
    assert response.status_code == 422
    assert response.json()["error"] == "Request validation failed."
    assert "fields" in response.json()["details"]

