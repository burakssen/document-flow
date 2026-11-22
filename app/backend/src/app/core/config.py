from functools import lru_cache

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    aws_region: str = "eu-central-1"
    aws_endpoint_url: str | None = None
    aws_access_key_id: str = "test"
    aws_secret_access_key: str = "test"

    s3_bucket_name: str = ""

    s3_presigned_url_ttl_seconds: int = 600
    max_upload_size_bytes: int = 50 * 1024 * 1024

    cognito_user_pool_id: str = ""
    cognito_client_id: str = ""
    cognito_region: str = "eu-central-1"
    cognito_verify_token: bool = True

    @model_validator(mode="after")
    def validate_configuration(self) -> "Settings":
        if not self.s3_bucket_name.strip():
            raise ValueError("S3_BUCKET_NAME must be configured.")

        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()
