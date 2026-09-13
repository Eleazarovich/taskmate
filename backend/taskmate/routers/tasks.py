"""Task CRUD and chess movement endpoints."""

from fastapi import APIRouter, Depends, HTTPException, Response, status

from ..auth import current_user, get_store
from ..models import (
    CreateTaskRequest,
    MoveResult,
    MoveTaskRequest,
    ReorderTaskRequest,
    Task,
    UpdateTaskRequest,
)
from ..store import InMemoryStore, TaskRecord, UserRecord


router = APIRouter(tags=["Tasks"])


def not_found() -> HTTPException:
    return HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resource not found.")


def owned_task_or_404(
    task_id: str, user: UserRecord, store: InMemoryStore
) -> TaskRecord:
    task = store.get_task_for_user(task_id, user.id)
    if task is None:
        raise not_found()
    return task


def owned_board_or_404(board_id: str, user: UserRecord, store: InMemoryStore) -> None:
    if store.get_board_for_user(board_id, user.id) is None:
        raise not_found()


@router.get("/boards/{board_id}/tasks", response_model=list[Task], response_model_exclude_none=True)
def get_tasks_by_board(
    board_id: str,
    user: UserRecord = Depends(current_user),
    store: InMemoryStore = Depends(get_store),
) -> list[Task]:
    owned_board_or_404(board_id, user, store)
    return store.tasks_for_board(board_id, user.id)


@router.post(
    "/boards/{board_id}/tasks",
    response_model=Task,
    response_model_exclude_none=True,
    status_code=status.HTTP_201_CREATED,
)
def create_task(
    board_id: str,
    request: CreateTaskRequest,
    user: UserRecord = Depends(current_user),
    store: InMemoryStore = Depends(get_store),
) -> Task:
    owned_board_or_404(board_id, user, store)
    return store.create_task(board_id, user.id, request)


@router.patch(
    "/tasks/{task_id}", response_model=Task, response_model_exclude_none=True
)
def update_task(
    task_id: str,
    request: UpdateTaskRequest,
    user: UserRecord = Depends(current_user),
    store: InMemoryStore = Depends(get_store),
) -> Task:
    task = owned_task_or_404(task_id, user, store)
    return store.update_task(task, request)


@router.delete("/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(
    task_id: str,
    user: UserRecord = Depends(current_user),
    store: InMemoryStore = Depends(get_store),
) -> Response:
    task = owned_task_or_404(task_id, user, store)
    store.delete_task(task)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.patch("/tasks/{task_id}/move", response_model=MoveResult)
def move_task(
    task_id: str,
    request: MoveTaskRequest,
    user: UserRecord = Depends(current_user),
    store: InMemoryStore = Depends(get_store),
) -> MoveResult:
    task = owned_task_or_404(task_id, user, store)
    success, rating_delta, is_victory, error = store.move_task(
        task, user, request.to_stage, request.new_position
    )
    return MoveResult(
        success=success,
        rating_delta=rating_delta,
        is_victory=is_victory,
        new_rating=user.rating,
        error=error,
    )


@router.patch("/tasks/{task_id}/reorder", status_code=status.HTTP_204_NO_CONTENT)
def reorder_task(
    task_id: str,
    request: ReorderTaskRequest,
    user: UserRecord = Depends(current_user),
    store: InMemoryStore = Depends(get_store),
) -> Response:
    task = owned_task_or_404(task_id, user, store)
    store.reorder_task(task, request.new_position)
    return Response(status_code=status.HTTP_204_NO_CONTENT)

