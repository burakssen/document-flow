from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class DocumentUploadRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    filename: str = Field(
        min_length=1,
        max_length=255,
    )

    content_type: str = Field(
        validation_alias="contentType",
        min_length=1,
        max_length=100,
    )

    size: int = Field(gt=0)


class DocumentUploadResponse(BaseModel):
    upload_id: UUID = Field(
        serialization_alias="uploadId",
    )

    object_key: str = Field(
        serialization_alias="objectKey",
    )

    upload_url: str = Field(
        serialization_alias="uploadUrl",
    )

    headers: dict[str, str]


class DocumentUploadCompleteResponse(BaseModel):
    upload_id: UUID = Field(
        serialization_alias="uploadId",
    )

    object_key: str = Field(
        serialization_alias="objectKey",
    )

    size: int

    content_type: str = Field(
        serialization_alias="contentType",
    )

    status: Literal["uploaded"]
