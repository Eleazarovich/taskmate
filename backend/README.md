# Taskmate backend

The backend is a FastAPI application with an in-memory store. It seeds the
demo account and boards used by the frontend:

- Email: `kasparov@chesskanban.app`
- Password: `KingMe2026!`

From this directory:

```bash
uv sync
uv run uvicorn main:app --reload
uv run pytest
```

Interactive API documentation is available at `http://localhost:8000/docs`.
Authentication accepts the HTTP-only `taskmate_session` cookie issued at
signup/login or an `Authorization: Bearer <accessToken>` header.

The frontend uses `http://localhost:8000` by default. Set
`NEXT_PUBLIC_API_URL` when it is hosted elsewhere, and set
`TASKMATE_CORS_ORIGINS` to a comma-separated list of allowed frontend origins
for deployments.
