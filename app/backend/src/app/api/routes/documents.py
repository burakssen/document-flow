import logging
from uuid import UUID, uuid4

from botocore.exceptions import BotoCoreError, ClientError
from fastapi import APIRouter, HTTPException, Query, status

from app.core.config import get_settings
from app.schemas.document import (
    DocumentUploadCompleteResponse,
    DocumentUploadRequest,
    DocumentUploadResponse,
)
from app.services.s3 import get_s3_client

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/documents",
    tags=["Documents"],
)


def sanitize_filename(filename: str) -> str:
    """Remove directory components and reject invalid filenames."""
    filename = filename.replace("\\", "/").rsplit("/", 1)[-1].strip()

    if (
        not filename
        or filename in {".", ".."}
        or any(ord(char) < 32 or ord(char) == 127 for char in filename)
    ):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Invalid filename.",
        )

    return filename


def get_object_key(upload_id: UUID, filename: str) -> str:
    return f"documents/{upload_id}/{filename}"


@router.post(
    "/upload",
    response_model=DocumentUploadResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_upload(
    request: DocumentUploadRequest,
) -> DocumentUploadResponse:
    settings = get_settings()

    if request.size <= 0:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Document size must be greater than zero.",
        )

    if request.size > settings.max_upload_size_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_CONTENT_TOO_LARGE,
            detail="The document exceeds the maximum upload size.",
        )

    filename = sanitize_filename(request.filename)

    upload_id = uuid4()
    object_key = get_object_key(upload_id, filename)

    try:
        s3 = get_s3_client()

        upload_url = s3.generate_presigned_url(
            ClientMethod="put_object",
            Params={
                "Bucket": settings.s3_bucket_name,
                "Key": object_key,
                "ContentType": request.content_type,
            },
            ExpiresIn=settings.s3_presigned_url_ttl_seconds,
            HttpMethod="PUT",
        )

    except BotoCoreError as exc:
        logger.exception("Failed to generate S3 upload URL")

        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Unable to initialize document upload.",
        ) from exc

    return DocumentUploadResponse(
        upload_id=upload_id,
        object_key=object_key,
        upload_url=upload_url,
        headers={
            "Content-Type": request.content_type,
        },
    )


@router.post(
    "/upload/{upload_id}/complete",
    response_model=DocumentUploadCompleteResponse,
)
def complete_upload(
    upload_id: UUID,
    filename: str = Query(
        min_length=1,
        max_length=255,
    ),
) -> DocumentUploadCompleteResponse:
    settings = get_settings()

    filename = sanitize_filename(filename)
    object_key = get_object_key(upload_id, filename)

    try:
        s3 = get_s3_client()

        result = s3.head_object(
            Bucket=settings.s3_bucket_name,
            Key=object_key,
        )

    except ClientError as exc:
        error_code = exc.response.get("Error", {}).get("Code")

        if error_code in {"404", "NoSuchKey", "NotFound"}:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="The uploaded document was not found.",
            ) from exc

        logger.exception(
            "Failed to verify uploaded document: %s",
            upload_id,
        )

        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Unable to verify the uploaded document.",
        ) from exc

    except BotoCoreError as exc:
        logger.exception(
            "S3 operation failed for upload: %s",
            upload_id,
        )

        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Unable to verify the uploaded document.",
        ) from exc

    size = result["ContentLength"]

    if size <= 0 or size > settings.max_upload_size_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_CONTENT_TOO_LARGE,
            detail="The uploaded document has an invalid size.",
        )

    return DocumentUploadCompleteResponse(
        upload_id=upload_id,
        object_key=object_key,
        size=size,
        content_type=result.get(
            "ContentType",
            "application/octet-stream",
        ),
        status="uploaded",
    )
