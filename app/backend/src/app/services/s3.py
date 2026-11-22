import boto3
from botocore.config import Config

from app.core.config import get_settings


def get_s3_client():
    settings = get_settings()

    addressing_style = "path" if settings.aws_endpoint_url else "virtual"

    return boto3.client(
        "s3",
        region_name=settings.aws_region,
        endpoint_url=settings.aws_endpoint_url,
        config=Config(
            signature_version="s3v4",
            s3={
                "addressing_style": addressing_style,
            },
        ),
    )
