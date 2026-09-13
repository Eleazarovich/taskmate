"""API request and response models for the Taskmate API."""

from datetime import date, datetime
from enum import Enum
from typing import Any

from pydantic import BaseModel, ConfigDict, EmailStr, Field, model_validator


def to_camel(value: str) -> str:
    """Convert Python field names to the camelCase used by the frontend."""

    first, *rest = value.split("_")
    return first + "".join(part.capitalize() for part in rest)


class APIModel(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        extra="forbid",
    )


class Stage(str, Enum):
    PAWN = "pawn"
    KNIGHT = "knight"
    BISHOP = "bishop"
    ROOK = "rook"
    QUEEN = "queen"
    KING = "king"


STAGES = tuple(Stage)


class Priority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class SignUpRequest(APIModel):
    name: str = Field(min_length=2)
    email: EmailStr
    password: str = Field(min_length=8)


class LoginRequest(APIModel):
    email: EmailStr
    password: str


class CreateBoardRequest(APIModel):
    name: str = Field(min_length=2, max_length=50)


class CreateTaskRequest(APIModel):
    title: str = Field(min_length=2, max_length=120)
    description: str | None = None
    priority: Priority | None = None
    due_date: date | None = None
    tags: list[str] = Field(default_factory=list)


class UpdateTaskRequest(APIModel):
    title: str | None = Field(default=None, min_length=2, max_length=120)
    description: str | None = None
    priority: Priority | None = None
    due_date: date | None = None
    tags: list[str] | None = None

    @model_validator(mode="after")
    def must_contain_an_update(self) -> "UpdateTaskRequest":
        if not self.model_fields_set:
            raise ValueError("At least one task field must be provided.")
        return self


class MoveTaskRequest(APIModel):
    to_stage: Stage
    new_position: int = Field(ge=0)


class ReorderTaskRequest(APIModel):
    new_position: int = Field(ge=0)


class User(APIModel):
    id: str
    name: str
    email: EmailStr
    rating: int = Field(ge=0)
    created_at: datetime
    updated_at: datetime


class Board(APIModel):
    id: str
    user_id: str
    name: str
    created_at: datetime
    updated_at: datetime


class Task(APIModel):
    id: str
    board_id: str
    title: str
    description: str | None = None
    priority: Priority | None = None
    due_date: date | None = None
    tags: list[str] = Field(default_factory=list)
    stage: Stage
    position: int = Field(ge=0)
    created_at: datetime
    updated_at: datetime


class MoveResult(APIModel):
    success: bool
    rating_delta: int = Field(ge=-1, le=1)
    is_victory: bool
    new_rating: int = Field(ge=0)
    error: str | None = None


class AuthResult(APIModel):
    success: bool
    user: User | None = None
    error: str | None = None
    access_token: str | None = None


class RecentMove(APIModel):
    id: str
    task_title: str
    from_stage: Stage
    to_stage: Stage
    rating_delta: int = Field(ge=-1, le=1)
    timestamp: datetime


class TasksByStage(APIModel):
    pawn: int = Field(ge=0)
    knight: int = Field(ge=0)
    bishop: int = Field(ge=0)
    rook: int = Field(ge=0)
    queen: int = Field(ge=0)
    king: int = Field(ge=0)


class PlayerStats(APIModel):
    user: User
    total_completed: int = Field(ge=0)
    total_boards: int = Field(ge=0)
    tasks_by_stage: TasksByStage
    recent_moves: list[RecentMove] = Field(max_length=8)


class ErrorResponse(APIModel):
    error: str
    details: dict[str, Any] | None = None

