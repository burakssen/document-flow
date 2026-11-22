"""Authentication routes backed by Cognito (server-side, no browser CORS)."""

import logging

from botocore.exceptions import BotoCoreError, ClientError
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from app.core.config import get_settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["Authentication"])


class SignupRequest(BaseModel):
    email: str = Field(min_length=1)
    password: str = Field(min_length=12)


class SignupResponse(BaseModel):
    user_sub: str = Field(serialization_alias="userSub")


class LoginRequest(BaseModel):
    email: str = Field(min_length=1)
    password: str = Field(min_length=1)


class LoginResponse(BaseModel):
    id_token: str = Field(serialization_alias="idToken")
    access_token: str = Field(serialization_alias="accessToken")
    refresh_token: str | None = Field(default=None, serialization_alias="refreshToken")


def _get_cognito_client():
    settings = get_settings()
    import boto3
    from botocore.config import Config

    return boto3.client(
        "cognito-idp",
        region_name=settings.cognito_region,
        endpoint_url=settings.aws_endpoint_url,
        aws_access_key_id=settings.aws_access_key_id,
        aws_secret_access_key=settings.aws_secret_access_key,
        config=Config(signature_version="s3v4"),
    )


@router.post(
    "/signup",
    response_model=SignupResponse,
    status_code=status.HTTP_201_CREATED,
)
def signup(request: SignupRequest) -> SignupResponse:
    """Create a new Cognito user pool user (server-side)."""
    print("Hello", request)
    settings = get_settings()
    client = _get_cognito_client()

    try:
        result = client.sign_up(
            ClientId=settings.cognito_client_id,
            Username=request.email,
            Password=request.password,
            UserAttributes=[{"Name": "email", "Value": request.email}],
        )
    except ClientError as exc:
        error_code = exc.response.get("Error", {}).get("Code", "")
        message = exc.response.get("Error", {}).get("Message", str(exc))

        if error_code == "UsernameExistsException":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An account with this email already exists.",
            ) from exc

        logger.exception("Cognito sign up failed")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=message or "Unable to create your account.",
        ) from exc
    except BotoCoreError as exc:
        logger.exception("Cognito sign up failed")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Unable to reach the authentication service.",
        ) from exc

    user_sub = result.get("UserSub")
    if not user_sub:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Sign up succeeded but no user sub was returned.",
        )

    # Confirm the user immediately so they can sign in without a
    # verification code (mirrors auto_verified_attributes behavior).
    try:
        client.admin_confirm_sign_up(
            UserPoolId=settings.cognito_user_pool_id,
            Username=request.email,
        )
    except ClientError as exc:
        error_code = exc.response.get("Error", {}).get("Code", "")
        if error_code != "AlreadyExistsException":
            logger.exception("Failed to confirm Cognito user after sign up")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Account created but could not be confirmed.",
            ) from exc

    return SignupResponse(user_sub=user_sub)


@router.post(
    "/login",
    response_model=LoginResponse,
)
def login(request: LoginRequest) -> LoginResponse:
    """Authenticate with Cognito USER_PASSWORD_AUTH (server-side)."""
    settings = get_settings()
    client = _get_cognito_client()

    try:
        result = client.initiate_auth(
            ClientId=settings.cognito_client_id,
            AuthFlow="USER_PASSWORD_AUTH",
            AuthParameters={
                "USERNAME": request.email,
                "PASSWORD": request.password,
            },
        )
    except ClientError as exc:
        error_code = exc.response.get("Error", {}).get("Code", "")
        message = exc.response.get("Error", {}).get("Message", str(exc))

        if error_code in {
            "NotAuthorizedException",
            "UserNotFoundException",
            "InvalidPasswordException",
        }:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password.",
            ) from exc

        logger.exception("Cognito sign in failed")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=message or "Unable to sign in.",
        ) from exc
    except BotoCoreError as exc:
        logger.exception("Cognito sign in failed")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAUTHORIZED,
            detail="Unable to reach the authentication service.",
        ) from exc

    auth_result = result.get("AuthenticationResult")
    if not auth_result or not auth_result.get("IdToken"):
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Sign in succeeded but no tokens were returned.",
        )

    return LoginResponse(
        id_token=auth_result["IdToken"],
        access_token=auth_result["AccessToken"],
        refresh_token=auth_result.get("RefreshToken"),
    )
