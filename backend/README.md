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

Set `TASKMATE_DATABASE_URL` to any SQLAlchemy database URL to select the
database used by the server. `DATABASE_URL` is also accepted as a generic
deployment convention. For example:

```bash
TASKMATE_DATABASE_URL=sqlite:///./local.db uv run uvicorn main:app --reload
```

The schema is created automatically on startup. SQLAlchemy keeps the store
database-agnostic, so a supported Postgres URL can be used later without
changing the API or repository code.

Interactive API documentation is available at `http://localhost:8000/docs`.
Authentication accepts the HTTP-only `taskmate_session` cookie issued at
signup/login or an `Authorization: Bearer <accessToken>` header.

The frontend uses `http://localhost:8000` by default. Set
`NEXT_PUBLIC_API_URL` when it is hosted elsewhere, and set
`TASKMATE_CORS_ORIGINS` to a comma-separated list of allowed frontend origins
for deployments.
