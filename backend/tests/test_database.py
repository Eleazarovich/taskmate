import pytest
from sqlalchemy import create_engine, inspect
from sqlalchemy.engine import make_url

from taskmate.database import Base, create_database, normalize_database_url


@pytest.mark.parametrize(
    "database_url",
    [
        "postgres://taskmate:secret@localhost:5432/taskmate",
        "postgresql://taskmate:secret@localhost:5432/taskmate?sslmode=require",
    ],
)
def test_common_postgres_urls_use_psycopg(database_url: str) -> None:
    normalized = make_url(normalize_database_url(database_url))

    assert normalized.drivername == "postgresql+psycopg"
    assert normalized.username == "taskmate"
    assert normalized.password == "secret"
    assert normalized.database == "taskmate"


def test_explicit_psycopg_url_is_unchanged() -> None:
    database_url = "postgresql+psycopg://taskmate:secret@localhost/taskmate"

    assert normalize_database_url(database_url) == database_url


def test_psycopg_dialect_is_available() -> None:
    engine = create_engine(
        normalize_database_url("postgresql://taskmate:secret@localhost/taskmate")
    )

    try:
        assert engine.url.drivername == "postgresql+psycopg"
        assert engine.dialect.name == "postgresql"
        assert engine.dialect.driver == "psycopg"
    finally:
        engine.dispose()


def test_sqlite_database_configuration_still_works() -> None:
    engine, session_factory = create_database("sqlite:///:memory:")

    try:
        assert engine.url.drivername == "sqlite"
        with session_factory() as session:
            assert session.bind is engine
            assert set(inspect(engine).get_table_names()) == set(Base.metadata.tables)
    finally:
        engine.dispose()
