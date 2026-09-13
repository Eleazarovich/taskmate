"""Authentication endpoints."""

from fastapi import APIRouter, Depends, Response, status
from fastapi.responses import JSONResponse

from ..auth import (
    SESSION_COOKIE,
    current_user,
    get_store,
    hash_password,
    optional_current_user,
    token_from_request,
)
from ..models import AuthResult, LoginRequest, SignUpRequest, User
from ..store import DatabaseStore, UserRecord


router = APIRouter(prefix="/auth", tags=["Authentication"])


def set_session_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=SESSION_COOKIE,
        value=token,
        httponly=True,
        samesite="lax",
        secure=False,
        max_age=60 * 60 * 24 * 7,
        path="/",
    )


def auth_failure(status_code: int, error: str) -> JSONResponse:
    result = AuthResult(success=False, error=error)
    return JSONResponse(
        status_code=status_code,
        content=result.model_dump(mode="json", by_alias=True, exclude_none=True),
    )


@router.post(
    "/signup",
    response_model=AuthResult,
    response_model_exclude_none=True,
    status_code=status.HTTP_200_OK,
)
def sign_up(
    request: SignUpRequest,
    response: Response,
    store: DatabaseStore = Depends(get_store),
) -> AuthResult | JSONResponse:
    user = store.create_user(
        name=request.name,
        email=str(request.email),
        password_hash=hash_password(request.password),
    )
    if user is None:
        return auth_failure(
            status.HTTP_409_CONFLICT,
            "An account with this email already exists.",
        )

    token = store.create_session(user.id)
    set_session_cookie(response, token)
    return AuthResult(success=True, user=user.public(), access_token=token)


@router.post(
    "/login",
    response_model=AuthResult,
    response_model_exclude_none=True,
    status_code=status.HTTP_200_OK,
)
def login(
    request: LoginRequest,
    response: Response,
    store: DatabaseStore = Depends(get_store),
) -> AuthResult | JSONResponse:
    user = store.authenticate(str(request.email), request.password)
    if user is None:
        return auth_failure(status.HTTP_401_UNAUTHORIZED, "Invalid credentials.")

    token = store.create_session(user.id)
    set_session_cookie(response, token)
    return AuthResult(success=True, user=user.public(), access_token=token)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(
    response: Response,
    token: str | None = Depends(token_from_request),
    store: DatabaseStore = Depends(get_store),
) -> Response:
    store.revoke_session(token)
    response.delete_cookie(key=SESSION_COOKIE, path="/")
    response.status_code = status.HTTP_204_NO_CONTENT
    return response


@router.get("/me", response_model=User | None, response_model_exclude_none=True)
def get_current_user(
    user: UserRecord | None = Depends(optional_current_user),
) -> User | None:
    return user.public() if user else None
