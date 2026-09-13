"""Board endpoints."""

from fastapi import APIRouter, Depends, HTTPException, Response, status

from ..auth import current_user, get_store
from ..models import Board, CreateBoardRequest
from ..store import InMemoryStore, UserRecord


router = APIRouter(prefix="/boards", tags=["Boards"])


def not_found() -> HTTPException:
    return HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resource not found.")


@router.get("", response_model=list[Board])
def get_boards(
    user: UserRecord = Depends(current_user),
    store: InMemoryStore = Depends(get_store),
) -> list[Board]:
    return store.boards_for_user(user.id)


@router.post("", response_model=Board, status_code=status.HTTP_201_CREATED)
def create_board(
    request: CreateBoardRequest,
    user: UserRecord = Depends(current_user),
    store: InMemoryStore = Depends(get_store),
) -> Board:
    return store.create_board(user.id, request.name)


@router.delete("/{board_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_board(
    board_id: str,
    user: UserRecord = Depends(current_user),
    store: InMemoryStore = Depends(get_store),
) -> Response:
    if not store.delete_board(board_id, user.id):
        raise not_found()
    return Response(status_code=status.HTTP_204_NO_CONTENT)

