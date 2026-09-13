"""Database-backed application store.

Routes use this small repository-style API instead of depending directly on
SQLAlchemy sessions. That keeps persistence details isolated and leaves room
for another SQLAlchemy-supported database without changing the HTTP layer.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime, timezone
import secrets
from enum import Enum
from uuid import uuid4

from sqlalchemy import delete, func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from .auth import hash_password, verify_password
from .database import (
    BoardModel,
    RecentMoveModel,
    SessionModel,
    TaskModel,
    UserModel,
    create_database,
    database_url_from_environment,
)
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


def _as_utc(value: datetime) -> datetime:
    """Normalize values returned by databases that discard timezone metadata."""

    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


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
            created_at=_as_utc(self.created_at),
            updated_at=_as_utc(self.updated_at),
        )


@dataclass
class BoardRecord:
    id: str
    user_id: str
    name: str
    created_at: datetime
    updated_at: datetime

    def public(self) -> Board:
        return Board(
            id=self.id,
            user_id=self.user_id,
            name=self.name,
            created_at=_as_utc(self.created_at),
            updated_at=_as_utc(self.updated_at),
        )


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
        return Task(
            id=self.id,
            board_id=self.board_id,
            title=self.title,
            description=self.description,
            priority=self.priority,
            due_date=self.due_date,
            tags=list(self.tags),
            stage=self.stage,
            position=self.position,
            created_at=_as_utc(self.created_at),
            updated_at=_as_utc(self.updated_at),
        )


@dataclass
class RecentMoveRecord:
    id: str
    task_title: str
    from_stage: Stage
    to_stage: Stage
    rating_delta: int
    timestamp: datetime

    def public(self) -> RecentMove:
        return RecentMove(
            id=self.id,
            task_title=self.task_title,
            from_stage=self.from_stage,
            to_stage=self.to_stage,
            rating_delta=self.rating_delta,
            timestamp=_as_utc(self.timestamp),
        )


class DatabaseStore:
    """Persistence gateway backed by a SQLAlchemy database."""

    def __init__(self, *, database_url: str | None = None, seed: bool = True) -> None:
        self.database_url = database_url or database_url_from_environment()
        self.engine, self.session_factory = create_database(self.database_url)
        if seed:
            self._seed_if_empty()

    def close(self) -> None:
        """Release the engine's connections."""

        self.engine.dispose()

    @property
    def users(self) -> dict[str, UserRecord]:
        """Return a snapshot for diagnostics and backwards-compatible callers."""

        with self.session_factory() as session:
            rows = session.scalars(select(UserModel)).all()
            return {row.id: self._user_record(row) for row in rows}

    @staticmethod
    def _new_id(prefix: str) -> str:
        return f"{prefix}-{uuid4().hex}"

    @staticmethod
    def _user_record(row: UserModel) -> UserRecord:
        return UserRecord(
            id=row.id,
            name=row.name,
            email=row.email,
            password_hash=row.password_hash,
            rating=row.rating,
            created_at=row.created_at,
            updated_at=row.updated_at,
        )

    @staticmethod
    def _board_record(row: BoardModel) -> BoardRecord:
        return BoardRecord(
            id=row.id,
            user_id=row.user_id,
            name=row.name,
            created_at=row.created_at,
            updated_at=row.updated_at,
        )

    @staticmethod
    def _task_record(row: TaskModel) -> TaskRecord:
        return TaskRecord(
            id=row.id,
            board_id=row.board_id,
            title=row.title,
            description=row.description,
            priority=Priority(row.priority) if row.priority else None,
            due_date=row.due_date,
            tags=list(row.tags or []),
            stage=Stage(row.stage),
            position=row.position,
            created_at=row.created_at,
            updated_at=row.updated_at,
        )

    @staticmethod
    def _move_record(row: RecentMoveModel) -> RecentMoveRecord:
        return RecentMoveRecord(
            id=row.id,
            task_title=row.task_title,
            from_stage=Stage(row.from_stage),
            to_stage=Stage(row.to_stage),
            rating_delta=row.rating_delta,
            timestamp=row.timestamp,
        )

    def _seed_if_empty(self) -> None:
        with self.session_factory() as session:
            has_user = session.scalar(select(UserModel.id).limit(1)) is not None
            if has_user:
                return

            user = UserModel(
                id="user-001",
                name="Kasparov Dev",
                email="kasparov@chesskanban.app",
                password_hash=hash_password("KingMe2026!"),
                rating=42,
                created_at=parse_datetime("2026-08-01T10:00:00Z"),
                updated_at=parse_datetime("2026-09-11T19:00:00Z"),
            )
            session.add(user)
            # Make the parent row visible before adding its foreign-key
            # children. PostgreSQL enforces the constraint during flush,
            # whereas SQLite's default foreign-key behavior can hide this
            # ordering requirement.
            session.flush()

            boards = [
                ("board-001", "Work Projects", "2026-08-02T09:00:00Z", "2026-09-10T14:00:00Z"),
                ("board-002", "Personal Goals", "2026-08-15T11:00:00Z", "2026-09-08T16:00:00Z"),
                ("board-003", "Coding Projects", "2026-09-01T08:00:00Z", "2026-09-11T19:00:00Z"),
            ]
            session.add_all(
                BoardModel(
                    id=board_id,
                    user_id=user.id,
                    name=name,
                    created_at=parse_datetime(created),
                    updated_at=parse_datetime(updated),
                )
                for board_id, name, created, updated in boards
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
            session.add_all(
                TaskModel(
                    id=task_id,
                    board_id=board_id,
                    title=title,
                    description=description,
                    priority=priority,
                    due_date=date.fromisoformat(due_date) if due_date else None,
                    tags=tags,
                    stage=stage,
                    position=position,
                    created_at=parse_datetime(created),
                    updated_at=parse_datetime(updated),
                )
                for task_id, board_id, title, description, priority, due_date, tags, stage, position, created, updated in seed_tasks
            )

            seed_moves = [
                ("move-001", "Portfolio auth system", "queen", "king", 1, "2026-09-09T17:00:00Z"),
                ("move-002", "Design system tokens v2", "rook", "queen", 1, "2026-09-11T10:00:00Z"),
                ("move-003", "Build Taskmate MVP", "rook", "queen", 1, "2026-09-11T09:30:00Z"),
                ("move-004", "Add drag-and-drop with @dnd-kit", "bishop", "rook", 1, "2026-09-10T15:00:00Z"),
                ("move-005", "Deploy staging environment", "queen", "king", 1, "2026-09-10T18:00:00Z"),
            ]
            session.add_all(
                RecentMoveModel(
                    id=move_id,
                    user_id=user.id,
                    task_title=title,
                    from_stage=from_stage,
                    to_stage=to_stage,
                    rating_delta=delta,
                    timestamp=parse_datetime(timestamp),
                )
                for move_id, title, from_stage, to_stage, delta, timestamp in seed_moves
            )
            session.commit()

    # Authentication ---------------------------------------------------------
    def authenticate(self, email: str, password: str) -> UserRecord | None:
        with self.session_factory() as session:
            row = session.scalar(select(UserModel).where(UserModel.email == email.lower()))
            if row is None or not verify_password(password, row.password_hash):
                return None
            return self._user_record(row)

    def create_user(self, name: str, email: str, password_hash: str) -> UserRecord | None:
        now = utc_now()
        user = UserModel(
            id=self._new_id("user"),
            name=name,
            email=email.lower(),
            password_hash=password_hash,
            rating=0,
            created_at=now,
            updated_at=now,
        )
        try:
            with self.session_factory() as session:
                if session.scalar(select(UserModel.id).where(UserModel.email == user.email)):
                    return None
                session.add(user)
                session.commit()
                return self._user_record(user)
        except IntegrityError:
            # The unique email constraint remains the source of truth when two
            # sign-ups race against one another.
            return None

    def create_session(self, user_id: str) -> str:
        token = secrets.token_urlsafe(32)
        with self.session_factory() as session:
            session.add(
                SessionModel(token=token, user_id=user_id, created_at=utc_now())
            )
            session.commit()
        return token

    def revoke_session(self, token: str | None) -> None:
        if token is None:
            return
        with self.session_factory() as session:
            session.execute(delete(SessionModel).where(SessionModel.token == token))
            session.commit()

    def user_for_token(self, token: str) -> UserRecord | None:
        with self.session_factory() as session:
            row = session.scalar(
                select(UserModel)
                .join(SessionModel, SessionModel.user_id == UserModel.id)
                .where(SessionModel.token == token)
            )
            return self._user_record(row) if row else None

    # Ownership and boards ---------------------------------------------------
    def boards_for_user(self, user_id: str) -> list[Board]:
        with self.session_factory() as session:
            rows = session.scalars(
                select(BoardModel)
                .where(BoardModel.user_id == user_id)
                .order_by(BoardModel.created_at, BoardModel.id)
            ).all()
            return [self._board_record(row).public() for row in rows]

    def get_board_for_user(self, board_id: str, user_id: str) -> BoardRecord | None:
        with self.session_factory() as session:
            row = session.scalar(
                select(BoardModel).where(
                    BoardModel.id == board_id, BoardModel.user_id == user_id
                )
            )
            return self._board_record(row) if row else None

    def create_board(self, user_id: str, name: str) -> Board:
        now = utc_now()
        board = BoardModel(
            id=self._new_id("board"),
            user_id=user_id,
            name=name,
            created_at=now,
            updated_at=now,
        )
        with self.session_factory() as session:
            session.add(board)
            session.commit()
            return self._board_record(board).public()

    def delete_board(self, board_id: str, user_id: str) -> bool:
        with self.session_factory() as session:
            board = session.scalar(
                select(BoardModel).where(
                    BoardModel.id == board_id, BoardModel.user_id == user_id
                )
            )
            if board is None:
                return False
            session.execute(delete(TaskModel).where(TaskModel.board_id == board_id))
            session.delete(board)
            session.commit()
            return True

    # Tasks ------------------------------------------------------------------
    def get_task_for_user(self, task_id: str, user_id: str) -> TaskRecord | None:
        with self.session_factory() as session:
            row = session.scalar(
                select(TaskModel)
                .join(BoardModel, BoardModel.id == TaskModel.board_id)
                .where(TaskModel.id == task_id, BoardModel.user_id == user_id)
            )
            return self._task_record(row) if row else None

    def tasks_for_board(self, board_id: str, user_id: str) -> list[Task]:
        with self.session_factory() as session:
            rows = session.scalars(
                select(TaskModel)
                .join(BoardModel, BoardModel.id == TaskModel.board_id)
                .where(TaskModel.board_id == board_id, BoardModel.user_id == user_id)
            ).all()
            records = [self._task_record(row) for row in rows]
            records.sort(key=lambda task: (STAGES.index(task.stage), task.position))
            return [task.public() for task in records]

    def create_task(self, board_id: str, user_id: str, request: CreateTaskRequest) -> Task:
        now = utc_now()
        with self.session_factory() as session:
            position = session.scalar(
                select(func.count(TaskModel.id)).where(
                    TaskModel.board_id == board_id, TaskModel.stage == Stage.PAWN.value
                )
            ) or 0
            task = TaskModel(
                id=self._new_id("task"),
                board_id=board_id,
                title=request.title,
                description=request.description,
                priority=request.priority.value if request.priority else None,
                due_date=request.due_date,
                tags=list(request.tags),
                stage=Stage.PAWN.value,
                position=position,
                created_at=now,
                updated_at=now,
            )
            session.add(task)
            session.commit()
            return self._task_record(task).public()

    def update_task(self, task: TaskRecord, request: UpdateTaskRequest) -> Task:
        with self.session_factory() as session:
            row = session.get(TaskModel, task.id)
            if row is None:
                raise ValueError("Task no longer exists.")
            updates = request.model_dump(exclude_unset=True)
            for field, value in updates.items():
                if isinstance(value, Enum):
                    value = value.value
                setattr(row, field, value)
            row.updated_at = utc_now()
            board = session.get(BoardModel, row.board_id)
            if board:
                board.updated_at = row.updated_at
            session.commit()
            return self._task_record(row).public()

    def delete_task(self, task: TaskRecord) -> None:
        with self.session_factory() as session:
            row = session.get(TaskModel, task.id)
            if row is None:
                return
            board_id, stage = row.board_id, row.stage
            session.delete(row)
            session.flush()
            self._resequence_in_session(session, board_id, stage)
            session.commit()

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

        now = utc_now()
        with self.session_factory() as session:
            row = session.get(TaskModel, task.id)
            user_row = session.get(UserModel, user.id)
            if row is None or user_row is None:
                return False, 0, False, "Resource no longer exists."

            source_tasks = session.scalars(
                select(TaskModel)
                .where(
                    TaskModel.board_id == row.board_id,
                    TaskModel.stage == from_stage.value,
                    TaskModel.id != row.id,
                )
                .order_by(TaskModel.position, TaskModel.id)
            ).all()
            destination_tasks = session.scalars(
                select(TaskModel)
                .where(
                    TaskModel.board_id == row.board_id,
                    TaskModel.stage == to_stage.value,
                )
                .order_by(TaskModel.position, TaskModel.id)
            ).all()
            destination_tasks.insert(min(new_position, len(destination_tasks)), row)

            row.stage = to_stage.value
            row.updated_at = now
            for index, candidate in enumerate(source_tasks):
                candidate.position = index
            for index, candidate in enumerate(destination_tasks):
                candidate.position = index

            rating_delta = 1 if to_index > from_index else -1
            user_row.rating = max(0, user_row.rating + rating_delta)
            user_row.updated_at = now
            session.add(
                RecentMoveModel(
                    id=self._new_id("move"),
                    user_id=user_row.id,
                    task_title=row.title,
                    from_stage=from_stage.value,
                    to_stage=to_stage.value,
                    rating_delta=rating_delta,
                    timestamp=now,
                )
            )
            board = session.get(BoardModel, row.board_id)
            if board:
                board.updated_at = now
            session.commit()

            user.rating = user_row.rating
            user.updated_at = user_row.updated_at
            return True, rating_delta, from_stage == Stage.QUEEN and to_stage == Stage.KING, None

    def reorder_task(self, task: TaskRecord, new_position: int) -> None:
        with self.session_factory() as session:
            row = session.get(TaskModel, task.id)
            if row is None:
                return
            candidates = session.scalars(
                select(TaskModel)
                .where(
                    TaskModel.board_id == row.board_id,
                    TaskModel.stage == row.stage,
                )
                .order_by(TaskModel.position, TaskModel.id)
            ).all()
            candidates.remove(row)
            candidates.insert(min(new_position, len(candidates)), row)
            for index, candidate in enumerate(candidates):
                candidate.position = index
            row.updated_at = utc_now()
            session.commit()

    @staticmethod
    def _resequence_in_session(session: Session, board_id: str, stage: str) -> None:
        candidates = session.scalars(
            select(TaskModel)
            .where(TaskModel.board_id == board_id, TaskModel.stage == stage)
            .order_by(TaskModel.position, TaskModel.id)
        ).all()
        for index, candidate in enumerate(candidates):
            candidate.position = index

    # Statistics -------------------------------------------------------------
    def stats_for_user(self, user: UserRecord) -> PlayerStats:
        with self.session_factory() as session:
            board_count = session.scalar(
                select(func.count(BoardModel.id)).where(BoardModel.user_id == user.id)
            ) or 0
            grouped_counts = session.execute(
                select(TaskModel.stage, func.count(TaskModel.id))
                .join(BoardModel, BoardModel.id == TaskModel.board_id)
                .where(BoardModel.user_id == user.id)
                .group_by(TaskModel.stage)
            ).all()
            counts: dict[str, int] = {stage.value: 0 for stage in STAGES}
            for stage, count in grouped_counts:
                counts[stage] = count

            recent_rows = session.scalars(
                select(RecentMoveModel)
                .where(RecentMoveModel.user_id == user.id)
                .order_by(RecentMoveModel.timestamp.desc(), RecentMoveModel.id.desc())
                .limit(8)
            ).all()
            return PlayerStats(
                user=user.public(),
                total_completed=counts[Stage.KING.value],
                total_boards=board_count,
                tasks_by_stage=TasksByStage(**counts),
                recent_moves=[self._move_record(row).public() for row in recent_rows],
            )
