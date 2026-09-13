"""FastAPI application entry point."""

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .models import ErrorResponse
from .routers import auth, boards, stats, tasks
from .store import InMemoryStore


app = FastAPI(
    title="Taskmate API",
    version="1.0.0",
    description="Backend for the Taskmate chess-inspired personal kanban board.",
)
app.state.store = InMemoryStore()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(HTTPException)
async def http_exception_handler(_: Request, exc: HTTPException) -> JSONResponse:
    if isinstance(exc.detail, dict):
        content = exc.detail
    else:
        content = {"error": str(exc.detail)}
    return JSONResponse(status_code=exc.status_code, content=content)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(
    _: Request, exc: RequestValidationError
) -> JSONResponse:
    details = {"fields": [
        {
            "location": list(error.get("loc", ())),
            "message": error.get("msg", "Invalid value."),
            "type": error.get("type", "validation_error"),
        }
        for error in exc.errors()
    ]}
    return JSONResponse(
        status_code=422,
        content=ErrorResponse(
            error="Request validation failed.", details=details
        ).model_dump(mode="json", by_alias=True, exclude_none=True),
    )


app.include_router(auth.router)
app.include_router(boards.router)
app.include_router(tasks.router)
app.include_router(stats.router)

