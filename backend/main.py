"""Compatibility entry point for ``uvicorn main:app`` from ``backend/``."""

if __package__:
    from .taskmate.main import app
else:
    from taskmate.main import app


__all__ = ["app"]

