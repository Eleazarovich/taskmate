"""Password hashing and bearer/session authentication helpers."""

from __future__ import annotations

import base64
import hashlib
import hmac
import secrets
from typing import TYPE_CHECKING

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import APIKeyCookie, HTTPAuthorizationCredentials, HTTPBearer

if TYPE_CHECKING:
    from .store import InMemoryStore, UserRecord


PASSWORD_ALGORITHM = "pbkdf2_sha256"
PASSWORD_ITERATIONS = 600_000
SESSION_COOKIE = "taskmate_session"
bearer_scheme = HTTPBearer(
    auto_error=False,
    scheme_name="bearerToken",
    description="Opaque bearer token returned by sign-up or login.",
)
cookie_scheme = APIKeyCookie(
    name=SESSION_COOKIE,
    auto_error=False,
    scheme_name="sessionCookie",
    description="Http-only session cookie issued by sign-up or login.",
)


def get_store(request: Request) -> InMemoryStore:
    """Return the application store, allowing tests to replace it cleanly."""

    return request.app.state.store


def hash_password(password: str) -> str:
    """Return a salted, one-way password hash.

    PBKDF2 is available in Python's standard library, keeps the backend easy to
    run with uv, and is deliberately slow enough to make password guessing more
    expensive than a plain digest.
    """

    salt = secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac(
        "sha256", password.encode("utf-8"), salt, PASSWORD_ITERATIONS
    )
    encode = lambda value: base64.urlsafe_b64encode(value).decode("ascii")
    return f"{PASSWORD_ALGORITHM}${PASSWORD_ITERATIONS}${encode(salt)}${encode(digest)}"


def verify_password(password: str, encoded_hash: str) -> bool:
    """Verify a password against a hash produced by :func:`hash_password`."""

    try:
        algorithm, iterations_text, salt_text, digest_text = encoded_hash.split("$")
        if algorithm != PASSWORD_ALGORITHM:
            return False
        iterations = int(iterations_text)
        salt = base64.urlsafe_b64decode(salt_text.encode("ascii"))
        expected = base64.urlsafe_b64decode(digest_text.encode("ascii"))
    except (ValueError, UnicodeDecodeError):
        return False

    actual = hashlib.pbkdf2_hmac(
        "sha256", password.encode("utf-8"), salt, iterations
    )
    return hmac.compare_digest(actual, expected)


def token_from_request(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    cookie: str | None = Depends(cookie_scheme),
) -> str | None:
    """Read bearer credentials first, with the spec's session cookie as fallback."""

    if credentials is not None:
        return credentials.credentials
    return cookie


def optional_current_user(
    store: InMemoryStore = Depends(get_store),
    token: str | None = Depends(token_from_request),
) -> UserRecord | None:
    """Resolve an optional user, rejecting credentials that are no longer valid."""

    if token is None:
        return None
    user = store.user_for_token(token)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required.",
        )
    return user


def current_user(
    user: UserRecord | None = Depends(optional_current_user),
) -> UserRecord:
    """Dependency for routes that require authentication."""

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required.",
        )
    return user
