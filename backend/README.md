# Taskmate backend

The backend is a FastAPI application backed by SQLAlchemy. By default it uses
the SQLite database file `taskmate.db` in this directory and seeds the demo
account and boards used by the frontend:

- Email: `kasparov@chesskanban.app`
- Password: `KingMe2026!`

From this directory:

```bash
uv sync
uv run uvicorn main:app --reload
uv run pytest
```

Set `TASKMATE_DATABASE_URL` to select the database used by the server.
`DATABASE_URL` is also accepted as a generic deployment convention. SQLite
continues to be the default for local development:

```bash
TASKMATE_DATABASE_URL=sqlite:///./local.db uv run uvicorn main:app --reload
```

Postgres is supported through the bundled psycopg 3 driver. Standard
`postgresql://` and legacy `postgres://` URLs are normalized automatically;
`postgresql+psycopg://` is also accepted:

```bash
TASKMATE_DATABASE_URL=postgresql://taskmate:password@localhost:5432/taskmate \
  uv run uvicorn main:app --reload
```

The schema is created automatically on startup for both SQLite and Postgres.
SQLAlchemy keeps the store database-agnostic, so switching databases does not
change the API or repository code.

Interactive API documentation is available at `http://localhost:8000/docs`.
Authentication accepts the HTTP-only `taskmate_session` cookie issued at
signup/login or an `Authorization: Bearer <accessToken>` header.

The frontend uses `http://localhost:8000` by default. Set
`NEXT_PUBLIC_API_URL` when it is hosted elsewhere, and set
`TASKMATE_CORS_ORIGINS` to a comma-separated list of allowed frontend origins
for deployments.
