"""SQLAlchemy database configuration and persistence models.

SQLite remains the default for local development, while Postgres is supported
through SQLAlchemy's psycopg 3 dialect in deployed environments.
"""

from __future__ import annotations

import os

from datetime import date, datetime

from sqlalchemy import JSON, Date, DateTime, ForeignKey, Integer, String, create_engine
from sqlalchemy.engine import Engine, make_url
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, sessionmaker
from sqlalchemy.pool import StaticPool


DEFAULT_DATABASE_URL = "sqlite:///./taskmate.db"
POSTGRES_DRIVER = "postgresql+psycopg"
POSTGRES_URL_SCHEMES = frozenset({"postgres", "postgresql"})


class Base(DeclarativeBase):
    """Base class for all persistence models."""


class UserModel(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(128), primary_key=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    email: Mapped[str] = mapped_column(String(320), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(512), nullable=False)
    rating: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)


class BoardModel(Base):
    __tablename__ = "boards"

    id: Mapped[str] = mapped_column(String(128), primary_key=True)
    user_id: Mapped[str] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    name: Mapped[str] = mapped_column(String(50), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)


class TaskModel(Base):
    __tablename__ = "tasks"

    id: Mapped[str] = mapped_column(String(128), primary_key=True)
    board_id: Mapped[str] = mapped_column(
        ForeignKey("boards.id", ondelete="CASCADE"), index=True, nullable=False
    )
    title: Mapped[str] = mapped_column(String(120), nullable=False)
    description: Mapped[str | None] = mapped_column(String(2000), nullable=True)
    priority: Mapped[str | None] = mapped_column(String(20), nullable=True)
    due_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    tags: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    stage: Mapped[str] = mapped_column(String(20), nullable=False)
    position: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)


class RecentMoveModel(Base):
    __tablename__ = "recent_moves"

    id: Mapped[str] = mapped_column(String(128), primary_key=True)
    user_id: Mapped[str] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    task_title: Mapped[str] = mapped_column(String(120), nullable=False)
    from_stage: Mapped[str] = mapped_column(String(20), nullable=False)
    to_stage: Mapped[str] = mapped_column(String(20), nullable=False)
    rating_delta: Mapped[int] = mapped_column(Integer, nullable=False)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)


class SessionModel(Base):
    __tablename__ = "sessions"

    token: Mapped[str] = mapped_column(String(128), primary_key=True)
    user_id: Mapped[str] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)


def database_url_from_environment() -> str:
    """Return the configured SQLAlchemy URL, defaulting to a local SQLite file."""

    return (
        os.getenv("TASKMATE_DATABASE_URL")
        or os.getenv("DATABASE_URL")
        or DEFAULT_DATABASE_URL
    )


def normalize_database_url(database_url: str) -> str:
    """Normalize common Postgres URLs to the installed psycopg 3 dialect.

    SQLAlchemy treats ``postgresql://`` as an alias for the psycopg2 dialect,
    while this application ships psycopg 3. Hosted database providers also
    commonly still emit the legacy ``postgres://`` scheme. Supporting both
    forms here keeps deployment configuration portable without requiring users
    to know the SQLAlchemy driver suffix.
    """

    parsed_url = make_url(database_url)
    if parsed_url.drivername in POSTGRES_URL_SCHEMES:
        return parsed_url.set(drivername=POSTGRES_DRIVER).render_as_string(
            hide_password=False
        )
    return database_url


def create_database(
    database_url: str | None = None,
) -> tuple[Engine, sessionmaker]:
    """Create an engine and session factory for a SQLAlchemy database URL."""

    url = normalize_database_url(database_url or database_url_from_environment())
    parsed_url = make_url(url)
    engine_options: dict[str, object] = {
        "future": True,
        "pool_pre_ping": True,
    }

    if parsed_url.drivername.startswith("sqlite"):
        engine_options["connect_args"] = {"check_same_thread": False}
        if parsed_url.database in (None, ":memory:"):
            # A memory database must use one connection so all request sessions
            # see the same schema and data. This option only affects SQLite.
            engine_options["poolclass"] = StaticPool

    engine = create_engine(url, **engine_options)
    Base.metadata.create_all(engine)
    return engine, sessionmaker(bind=engine, expire_on_commit=False)
