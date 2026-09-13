# syntax=docker/dockerfile:1

FROM node:22-alpine AS frontend-builder

WORKDIR /app

COPY ["frontend/package.json", "./"]
RUN npm install

COPY ["frontend/", "./"]

# An empty value makes the browser call the backend on the current origin.
# Pass --build-arg NEXT_PUBLIC_API_URL=... for a separately hosted API.
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
RUN npm run build

FROM python:3.12-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app/backend

COPY --from=ghcr.io/astral-sh/uv:0.12.9 /uv /uvx /bin/

WORKDIR /app

COPY backend/pyproject.toml backend/uv.lock ./backend/
RUN uv sync --directory backend --locked --no-dev

COPY backend/ ./backend/
COPY --from=frontend-builder /app/out ./frontend

EXPOSE 8000

CMD ["/app/backend/.venv/bin/uvicorn", "main:app", "--app-dir", "/app/backend", "--host", "0.0.0.0", "--port", "8000"]
