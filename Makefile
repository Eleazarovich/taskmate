.PHONY: install run test integration-test help

help:
	@echo "make install  Install backend dependencies"
	@echo "make run      Start the FastAPI development server"
	@echo "make test     Run the backend test suite"
	@echo "make integration-test  Run HTTP tests against Docker Compose"

install:
	cd backend && uv sync

run:
	cd backend && uv run uvicorn main:app --reload

test:
	cd backend && uv run pytest

integration-test:
	@set -eu; \
		compose_project=taskmate-integration-$$$$; \
		app_port=$${TASKMATE_INTEGRATION_PORT:-8001}; \
		export COMPOSE_PROJECT_NAME=$$compose_project; \
		trap 'docker compose down -v --remove-orphans' EXIT INT TERM; \
		docker compose down -v --remove-orphans; \
		TASKMATE_APP_PORT=$$app_port docker compose up -d --build --wait; \
		(cd backend && TASKMATE_API_URL=http://127.0.0.1:$$app_port uv run pytest tests/integration -m integration)
