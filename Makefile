.PHONY: install run test help

help:
	@echo "make install  Install backend dependencies"
	@echo "make run      Start the FastAPI development server"
	@echo "make test     Run the backend test suite"

install:
	cd backend && uv sync

run:
	cd backend && uv run uvicorn main:app --reload

test:
	cd backend && uv run pytest

