"""Thread-safe-enough in-memory data store used by the API and tests."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime, timezone
import secrets
from typing import Iterable

from .auth import hash_password, verify_password
from .models import (
    Board,
    CreateTaskRequest,
    PlayerStats,
    Priority,
    RecentMove,
    Stage,
    Task,
    TasksByStage,
    UpdateTaskRequest,
    User,
    STAGES,
)


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def parse_datetime(value: str) -> datetime:
    return datetime.fromisoformat(value.replace("Z", "+00:00"))


@dataclass
class UserRecord:
    id: str
    name: str
    email: str
    password_hash: str
    rating: int
    created_at: datetime
    updated_at: datetime

    def public(self) -> User:
        return User(
            id=self.id,
            name=self.name,
            email=self.email,
            rating=self.rating,
            created_at=self.created_at,
            updated_at=self.updated_at,
        )


@dataclass
class BoardRecord:
    id: str
    user_id: str
    name: str
    created_at: datetime
    updated_at: datetime

    def public(self) -> Board:
        return Board.model_validate(self.__dict__)


@dataclass
class TaskRecord:
    id: str
    board_id: str
    title: str
    description: str | None
    priority: Priority | None
    due_date: date | None
    tags: list[str]
    stage: Stage
    position: int
    created_at: datetime
    updated_at: datetime

    def public(self) -> Task:
        return Task.model_validate(self.__dict__)


@dataclass
class RecentMoveRecord:
    id: str
    task_title: str
    from_stage: Stage
    to_stage: Stage
    rating_delta: int
    timestamp: datetime

    def public(self) -> RecentMove:
        return RecentMove.model_validate(self.__dict__)


class InMemoryStore:
    """A small application store with seeded demo data.

    The store owns sessions as well as domain objects so a fresh instance gives
    tests an isolated application state without any database setup.
    """

    def __init__(self, *, seed: bool = True) -> None:
        self.users: dict[str, UserRecord] = {}
        self.users_by_email: dict[str, str] = {}
        self.boards: dict[str, BoardRecord] = {}
        self.tasks: dict[str, TaskRecord] = {}
        self.recent_moves: dict[str, list[RecentMoveRecord]] = {}
        self.sessions: dict[str, str] = {}
        self._counters = {"user": 1, "board": 1, "task": 1, "move": 1}
        if seed:
            self._seed()

    def _new_id(self, prefix: str) -> str:
        value = self._counters[prefix]
        self._counters[prefix] += 1
        return f"{prefix}-{value:03d}"

    def _seed(self) -> None:
        user = UserRecord(
            id="user-001",
            name="Kasparov Dev",
            email="kasparov@chesskanban.app",
            password_hash=hash_password("KingMe2026!"),
            rating=42,
            created_at=parse_datetime("2026-08-01T10:00:00Z"),
            updated_at=parse_datetime("2026-09-11T19:00:00Z"),
        )
        self._add_user(user)

        boards = [
            ("board-001", "Work Projects", "2026-08-02T09:00:00Z", "2026-09-10T14:00:00Z"),
            ("board-002", "Personal Goals", "2026-08-15T11:00:00Z", "2026-09-08T16:00:00Z"),
            ("board-003", "Coding Projects", "2026-09-01T08:00:00Z", "2026-09-11T19:00:00Z"),
        ]
        for board_id, name, created, updated in boards:
            self.boards[board_id] = BoardRecord(
                id=board_id,
                user_id=user.id,
                name=name,
                created_at=parse_datetime(created),
                updated_at=parse_datetime(updated),
            )

        seed_tasks = [
            ("task-001", "board-001", "Define Q4 product roadmap", "Align with stakeholders on priorities for Q4 delivery milestones.", "high", "2026-09-20", ["Planning", "Q4"], "rook", 0, "2026-08-10T09:00:00Z", "2026-09-09T14:00:00Z"),
            ("task-002", "board-001", "Migrate auth to OAuth2", "Replace legacy session auth with OAuth2 provider integration.", "critical", "2026-09-15", ["Auth", "Security", "Backend"], "bishop", 0, "2026-08-12T10:00:00Z", "2026-09-10T11:00:00Z"),
            ("task-003", "board-001", "Write API documentation", "Document all public endpoints with request/response examples.", "medium", "2026-09-25", ["Docs", "API"], "knight", 0, "2026-08-14T08:00:00Z", "2026-09-05T09:00:00Z"),
            ("task-004", "board-001", "Set up CI/CD pipeline", None, "high", None, ["DevOps", "Automation"], "pawn", 0, "2026-08-20T10:00:00Z", "2026-08-20T10:00:00Z"),
            ("task-005", "board-001", "Performance audit — dashboard load time", None, "medium", None, ["Performance"], "pawn", 1, "2026-09-01T09:00:00Z", "2026-09-01T09:00:00Z"),
            ("task-006", "board-001", "Design system tokens v2", "Refresh color and typography tokens across all components.", "low", None, ["Design", "UI"], "queen", 0, "2026-08-05T10:00:00Z", "2026-09-11T10:00:00Z"),
            ("task-007", "board-001", "Deploy staging environment", None, "high", "2026-09-12", ["DevOps"], "king", 0, "2026-07-28T08:00:00Z", "2026-09-10T18:00:00Z"),
            ("task-008", "board-001", "User research interviews — 5 sessions", None, "medium", None, ["Research", "UX"], "pawn", 2, "2026-09-05T10:00:00Z", "2026-09-05T10:00:00Z"),
            ("task-009", "board-002", 'Read "Deep Work" by Cal Newport', None, "low", None, ["Books", "Learning"], "bishop", 0, "2026-08-18T20:00:00Z", "2026-09-08T21:00:00Z"),
            ("task-010", "board-002", "Run 5k three times per week", None, "medium", None, ["Health", "Fitness"], "knight", 0, "2026-08-01T07:00:00Z", "2026-09-01T07:00:00Z"),
            ("task-011", "board-002", "Learn Spanish — Duolingo streak 30d", None, "low", None, ["Language", "Learning"], "pawn", 0, "2026-09-01T09:00:00Z", "2026-09-01T09:00:00Z"),
            ("task-012", "board-002", "Plan October hiking trip", None, "medium", "2026-09-30", ["Travel", "Personal"], "pawn", 1, "2026-09-05T18:00:00Z", "2026-09-05T18:00:00Z"),
            ("task-013", "board-003", "Build Taskmate MVP", "Full-stack personal kanban with chess progression system.", "critical", "2026-09-15", ["MVP", "Next.js", "Chess"], "queen", 0, "2026-08-25T10:00:00Z", "2026-09-11T19:00:00Z"),
            ("task-014", "board-003", "Add drag-and-drop with @dnd-kit", None, "high", None, ["DnD", "UI"], "rook", 0, "2026-09-02T11:00:00Z", "2026-09-10T15:00:00Z"),
            ("task-015", "board-003", "Implement sound feedback system", None, "medium", None, ["Audio", "UX"], "bishop", 0, "2026-09-05T09:00:00Z", "2026-09-09T14:00:00Z"),
            ("task-016", "board-003", "Write unit tests for services layer", None, "high", None, ["Testing", "Quality"], "knight", 0, "2026-09-08T10:00:00Z", "2026-09-08T10:00:00Z"),
            ("task-017", "board-003", "Set up Vercel deployment", None, "medium", None, ["DevOps", "Deploy"], "pawn", 0, "2026-09-11T08:00:00Z", "2026-09-11T08:00:00Z"),
            ("task-018", "board-003", "Portfolio auth system", None, "critical", "2026-09-18", ["Auth", "Portfolio"], "king", 0, "2026-08-20T09:00:00Z", "2026-09-09T17:00:00Z"),
        ]
        for row in seed_tasks:
            task_id, board_id, title, description, priority, due_date, tags, stage, position, created, updated = row
            self.tasks[task_id] = TaskRecord(
                id=task_id,
                board_id=board_id,
                title=title,
                description=description,
                priority=Priority(priority) if priority else None,
                due_date=date.fromisoformat(due_date) if due_date else None,
                tags=tags,
                stage=Stage(stage),
                position=position,
                created_at=parse_datetime(created),
                updated_at=parse_datetime(updated),
            )

        for row in [
            ("move-001", "Portfolio auth system", "queen", "king", 1, "2026-09-09T17:00:00Z"),
            ("move-002", "Design system tokens v2", "rook", "queen", 1, "2026-09-11T10:00:00Z"),
            ("move-003", "Build Taskmate MVP", "rook", "queen", 1, "2026-09-11T09:30:00Z"),
            ("move-004", "Add drag-and-drop with @dnd-kit", "bishop", "rook", 1, "2026-09-10T15:00:00Z"),
            ("move-005", "Deploy staging environment", "queen", "king", 1, "2026-09-10T18:00:00Z"),
        ]:
            move_id, title, from_stage, to_stage, delta, timestamp = row
            self.recent_moves[user.id].append(
                RecentMoveRecord(
                    id=move_id,
                    task_title=title,
                    from_stage=Stage(from_stage),
                    to_stage=Stage(to_stage),
                    rating_delta=delta,
                    timestamp=parse_datetime(timestamp),
                )
            )

        self._counters.update(user=2, board=4, task=19, move=6)

    def _add_user(self, user: UserRecord) -> None:
        self.users[user.id] = user
        self.users_by_email[user.email.lower()] = user.id
        self.recent_moves.setdefault(user.id, [])

    # Authentication ---------------------------------------------------------
    def authenticate(self, email: str, password: str) -> UserRecord | None:
        user_id = self.users_by_email.get(email.lower())
        user = self.users.get(user_id) if user_id else None
        if user is None or not verify_password(password, user.password_hash):
            return None
        return user

    def create_user(self, name: str, email: str, password_hash: str) -> UserRecord | None:
        normalized_email = email.lower()
        if normalized_email in self.users_by_email:
            return None
        now = utc_now()
        user = UserRecord(
            id=self._new_id("user"),
            name=name,
            email=normalized_email,
            password_hash=password_hash,
            rating=0,
            created_at=now,
            updated_at=now,
        )
        self._add_user(user)
        return user

    def create_session(self, user_id: str) -> str:
        token = secrets.token_urlsafe(32)
        self.sessions[token] = user_id
        return token

    def revoke_session(self, token: str | None) -> None:
        if token:
            self.sessions.pop(token, None)

    def user_for_token(self, token: str) -> UserRecord | None:
        user_id = self.sessions.get(token)
        return self.users.get(user_id) if user_id else None

    # Ownership and boards ---------------------------------------------------
    def boards_for_user(self, user_id: str) -> list[Board]:
        return [
            board.public()
            for board in self.boards.values()
            if board.user_id == user_id
        ]

    def get_board_for_user(self, board_id: str, user_id: str) -> BoardRecord | None:
        board = self.boards.get(board_id)
        return board if board and board.user_id == user_id else None

    def create_board(self, user_id: str, name: str) -> Board:
        now = utc_now()
        board = BoardRecord(
            id=self._new_id("board"),
            user_id=user_id,
            name=name,
            created_at=now,
            updated_at=now,
        )
        self.boards[board.id] = board
        return board.public()

    def delete_board(self, board_id: str, user_id: str) -> bool:
        board = self.get_board_for_user(board_id, user_id)
        if board is None:
            return False
        self.boards.pop(board_id)
        for task_id in [task.id for task in self.tasks.values() if task.board_id == board_id]:
            self.tasks.pop(task_id)
        return True

    # Tasks ------------------------------------------------------------------
    def get_task_for_user(self, task_id: str, user_id: str) -> TaskRecord | None:
        task = self.tasks.get(task_id)
        if task is None:
            return None
        board = self.boards.get(task.board_id)
        return task if board and board.user_id == user_id else None

    def tasks_for_board(self, board_id: str, user_id: str) -> list[Task]:
        if self.get_board_for_user(board_id, user_id) is None:
            return []
        return [
            task.public()
            for task in sorted(
                (task for task in self.tasks.values() if task.board_id == board_id),
                key=lambda task: (STAGES.index(task.stage), task.position),
            )
        ]

    def create_task(self, board_id: str, user_id: str, request: CreateTaskRequest) -> Task:
        now = utc_now()
        position = sum(
            task.board_id == board_id and task.stage == Stage.PAWN
            for task in self.tasks.values()
        )
        task = TaskRecord(
            id=self._new_id("task"),
            board_id=board_id,
            title=request.title,
            description=request.description,
            priority=request.priority,
            due_date=request.due_date,
            tags=list(request.tags),
            stage=Stage.PAWN,
            position=position,
            created_at=now,
            updated_at=now,
        )
        self.tasks[task.id] = task
        return task.public()

    def update_task(self, task: TaskRecord, request: UpdateTaskRequest) -> Task:
        updates = request.model_dump(exclude_unset=True)
        for field, value in updates.items():
            setattr(task, field, value)
        task.updated_at = utc_now()
        board = self.boards.get(task.board_id)
        if board:
            board.updated_at = task.updated_at
        return task.public()

    def delete_task(self, task: TaskRecord) -> None:
        self.tasks.pop(task.id, None)
        self._resequence(task.board_id, task.stage)

    def move_task(
        self, task: TaskRecord, user: UserRecord, to_stage: Stage, new_position: int
    ) -> tuple[bool, int, bool, str | None]:
        from_stage = task.stage
        if from_stage == to_stage:
            return True, 0, False, None
        from_index = STAGES.index(from_stage)
        to_index = STAGES.index(to_stage)
        if abs(from_index - to_index) != 1:
            return (
                False,
                0,
                False,
                "Invalid move — tasks can only move one stage at a time.",
            )

        old_stage = task.stage
        self._remove_from_stage(task)
        destination = sorted(
            (
                candidate
                for candidate in self.tasks.values()
                if candidate.board_id == task.board_id and candidate.stage == to_stage
            ),
            key=lambda candidate: candidate.position,
        )
        destination.insert(min(new_position, len(destination)), task)
        task.stage = to_stage
        task.updated_at = utc_now()
        for index, candidate in enumerate(destination):
            candidate.position = index
        self._resequence(task.board_id, old_stage)

        rating_delta = 1 if to_index > from_index else -1
        user.rating = max(0, user.rating + rating_delta)
        user.updated_at = task.updated_at
        move = RecentMoveRecord(
            id=self._new_id("move"),
            task_title=task.title,
            from_stage=from_stage,
            to_stage=to_stage,
            rating_delta=rating_delta,
            timestamp=task.updated_at,
        )
        self.recent_moves[user.id].insert(0, move)
        self.recent_moves[user.id] = self.recent_moves[user.id][:20]
        board = self.boards.get(task.board_id)
        if board:
            board.updated_at = task.updated_at
        return True, rating_delta, from_stage == Stage.QUEEN and to_stage == Stage.KING, None

    def reorder_task(self, task: TaskRecord, new_position: int) -> None:
        candidates = sorted(
            (
                candidate
                for candidate in self.tasks.values()
                if candidate.board_id == task.board_id and candidate.stage == task.stage
            ),
            key=lambda candidate: candidate.position,
        )
        candidates.remove(task)
        candidates.insert(min(new_position, len(candidates)), task)
        now = utc_now()
        for index, candidate in enumerate(candidates):
            candidate.position = index
        task.updated_at = now

    def _remove_from_stage(self, task: TaskRecord) -> None:
        self.tasks.pop(task.id)
        self._resequence(task.board_id, task.stage)
        self.tasks[task.id] = task

    def _resequence(self, board_id: str, stage: Stage) -> None:
        candidates = sorted(
            (
                candidate
                for candidate in self.tasks.values()
                if candidate.board_id == board_id and candidate.stage == stage
            ),
            key=lambda candidate: candidate.position,
        )
        for index, candidate in enumerate(candidates):
            candidate.position = index

    # Statistics -------------------------------------------------------------
    def stats_for_user(self, user: UserRecord) -> PlayerStats:
        user_boards = [board for board in self.boards.values() if board.user_id == user.id]
        board_ids = {board.id for board in user_boards}
        user_tasks = [task for task in self.tasks.values() if task.board_id in board_ids]
        counts = {stage.value: sum(task.stage == stage for task in user_tasks) for stage in STAGES}
        return PlayerStats(
            user=user.public(),
            total_completed=counts[Stage.KING.value],
            total_boards=len(user_boards),
            tasks_by_stage=TasksByStage(**counts),
            recent_moves=[move.public() for move in self.recent_moves[user.id][:8]],
        )

