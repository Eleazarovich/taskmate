from fastapi.testclient import TestClient


def test_invalid_move_does_not_change_task_or_rating(logged_in: tuple[TestClient, str]) -> None:
    client, _ = logged_in
    response = client.patch(
        "/tasks/task-004/move",
        json={"toStage": "bishop", "newPosition": 0},
    )
    assert response.status_code == 200
    assert response.json() == {
        "success": False,
        "ratingDelta": 0,
        "isVictory": False,
        "newRating": 42,
        "error": "Invalid move — tasks can only move one stage at a time.",
    }
    task = next(task for task in client.get("/boards/board-001/tasks").json() if task["id"] == "task-004")
    assert task["stage"] == "pawn"
    assert task["position"] == 0


def test_legal_moves_update_stage_rating_and_victory(
    logged_in: tuple[TestClient, str]
) -> None:
    client, _ = logged_in
    forward = client.patch(
        "/tasks/task-004/move",
        json={"toStage": "knight", "newPosition": 0},
    )
    assert forward.json() == {
        "success": True,
        "ratingDelta": 1,
        "isVictory": False,
        "newRating": 43,
    }

    backward = client.patch(
        "/tasks/task-004/move",
        json={"toStage": "pawn", "newPosition": 0},
    )
    assert backward.json()["ratingDelta"] == -1
    assert backward.json()["newRating"] == 42

    victory = client.patch(
        "/tasks/task-013/move",
        json={"toStage": "king", "newPosition": 0},
    )
    assert victory.json() == {
        "success": True,
        "ratingDelta": 1,
        "isVictory": True,
        "newRating": 43,
    }


def test_same_stage_move_is_a_noop(logged_in: tuple[TestClient, str]) -> None:
    client, _ = logged_in
    response = client.patch(
        "/tasks/task-004/move",
        json={"toStage": "pawn", "newPosition": 2},
    )
    assert response.json() == {
        "success": True,
        "ratingDelta": 0,
        "isVictory": False,
        "newRating": 42,
    }


def test_stats_reflect_seed_data_and_moves(logged_in: tuple[TestClient, str]) -> None:
    client, _ = logged_in
    stats = client.get("/player/stats")
    assert stats.status_code == 200
    body = stats.json()
    assert body["totalBoards"] == 3
    assert body["totalCompleted"] == 2
    assert body["tasksByStage"] == {
        "pawn": 6,
        "knight": 3,
        "bishop": 3,
        "rook": 2,
        "queen": 2,
        "king": 2,
    }
    assert len(body["recentMoves"]) == 5

    client.patch(
        "/tasks/task-017/move",
        json={"toStage": "knight", "newPosition": 0},
    )
    updated = client.get("/player/stats").json()
    assert updated["tasksByStage"]["pawn"] == 5
    assert updated["tasksByStage"]["knight"] == 4
    assert updated["recentMoves"][0]["taskTitle"] == "Set up Vercel deployment"

