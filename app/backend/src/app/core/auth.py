"""Cognito ID token verification for protected API routes."""

import json
from functools import lru_cache
from typing import Annotated

import jwt
import requests
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt import (
    ExpiredSignatureError,
    InvalidAudienceError,
    InvalidIssuerError,
    PyJWTError,
)
from jwt.algorithms import RSAAlgorithm

from app.core.config import get_settings

bearer_scheme = HTTPBearer(auto_error=False)


class CognitoTokenError(Exception):
    """Raised when a Cognito ID token cannot be verified."""


@lru_cache(maxsize=1)
def _fetch_jwks(jwks_url: str) -> dict:
    response = requests.get(jwks_url, timeout=10)
    response.raise_for_status()
    return response.json()


def _find_signing_key(jwks: dict, kid: str):
    for key in jwks.get("keys", []):
        if key.get("kid") == kid:
            return RSAAlgorithm.from_jwk(json.dumps(key))
    return None


def verify_cognito_id_token(token: str) -> dict:
    """Verify a Cognito ID token and return its claims.

    When ``cognito_verify_token`` is disabled (local development against a mock
    provider that does not issue verifiable JWTs) the token is decoded without
    signature verification so the local flow keeps working.
    """
    settings = get_settings()

    if not settings.cognito_verify_token:
        return jwt.decode(token, options={"verify_signature": False})

    if not settings.cognito_user_pool_id:
        raise CognitoTokenError("Cognito user pool is not configured.")

    region = settings.cognito_region
    user_pool_id = settings.cognito_user_pool_id
    jwks_url = (
        f"https://cognito-idp.{region}.amazonaws.com/{user_pool_id}"
        "/.well-known/jwks.json"
    )
    issuer = f"https://cognito-idp.{region}.amazonaws.com/{user_pool_id}"

    try:
        jwks = _fetch_jwks(jwks_url)
    except Exception as exc:  # network / malformed JWKS
        raise CognitoTokenError(f"Unable to fetch Cognito JWKS: {exc}") from exc

    try:
        header = jwt.get_unverified_header(token)
    except PyJWTError as exc:
        raise CognitoTokenError(f"Invalid token header: {exc}") from exc

    kid = header.get("kid")
    if not kid:
        raise CognitoTokenError("Token is missing a key ID.")

    key = _find_signing_key(jwks, kid)
    if key is None:
        raise CognitoTokenError("No matching Cognito signing key found.")

    try:
        return jwt.decode(
            token,
            key,
            algorithms=["RS256"],
            audience=settings.cognito_client_id or None,
            issuer=issuer,
            options={"require": ["exp", "iss", "aud"]},
        )
    except ExpiredSignatureError as exc:
        raise CognitoTokenError("ID token has expired.") from exc
    except InvalidAudienceError as exc:
        raise CognitoTokenError("ID token audience does not match the client.") from exc
    except InvalidIssuerError as exc:
        raise CognitoTokenError(
            "ID token issuer does not match the user pool."
        ) from exc
    except PyJWTError as exc:
        raise CognitoTokenError(f"ID token verification failed: {exc}") from exc


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
) -> dict:
    """FastAPI dependency: authenticate the request via a Cognito ID token."""
    token = credentials.credentials if credentials else None
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated.",
        )

    try:
        return verify_cognito_id_token(token)
    except CognitoTokenError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(exc),
        ) from exc
