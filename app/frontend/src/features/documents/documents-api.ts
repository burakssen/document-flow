import { API_URL } from "@/lib/config"

export class UploadApiError extends Error {
  public readonly status?: number

  constructor(message: string, status?: number) {
    super(message)

    this.name = "UploadApiError"
    this.status = status
  }
}

export interface UploadResult {
  uploadId: string
  objectKey: string
  status: "uploaded"
}

interface InitializeUploadResponse {
  uploadId: string
  objectKey: string
  uploadUrl: string
  headers: Record<string, string>
}

export type UploadStage = "initializing" | "uploading" | "confirming"

interface UploadCallbacks {
  onStage?: (stage: UploadStage) => void
  onProgress?: (percentage: number) => void
}

export function isAbortError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    error.name === "AbortError"
  )
}

function getHttpErrorMessage(status: number): string {
  switch (status) {
    case 400:
    case 422:
      return "The server could not accept this upload."

    case 401:
      return "You must sign in before uploading documents."

    case 403:
      return "You do not have permission to upload documents."

    case 404:
      return "The requested upload could not be found."

    case 409:
      return "The upload is in an invalid state."

    case 413:
      return "The document exceeds the permitted upload size."

    case 415:
      return "The server does not support this document type."

    case 429:
      return "Too many upload requests. Please try again later."

    default:
      return status >= 500
        ? "The server could not process your upload."
        : `Upload failed (HTTP ${status}).`
  }
}

async function apiRequest(url: string, init: RequestInit): Promise<Response> {
  try {
    return await fetch(url, init)
  } catch (error) {
    if (isAbortError(error)) {
      throw error
    }

    throw new UploadApiError(
      "Unable to connect to the server. Check your connection and try again."
    )
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

async function initializeUpload(
  file: File,
  signal: AbortSignal
): Promise<InitializeUploadResponse> {
  const response = await apiRequest(`${API_URL}/documents/upload`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      filename: file.name,
      contentType: file.type || "application/octet-stream",
      size: file.size,
    }),
    signal,
  })

  if (!response.ok) {
    throw new UploadApiError(
      getHttpErrorMessage(response.status),
      response.status
    )
  }

  let payload: unknown

  try {
    payload = await response.json()
  } catch {
    throw new UploadApiError("The upload service returned an invalid response.")
  }

  if (
    !isRecord(payload) ||
    typeof payload.uploadId !== "string" ||
    typeof payload.objectKey !== "string" ||
    typeof payload.uploadUrl !== "string" ||
    !isRecord(payload.headers) ||
    !Object.values(payload.headers).every((value) => typeof value === "string")
  ) {
    throw new UploadApiError("The upload service returned an invalid response.")
  }

  return {
    uploadId: payload.uploadId,
    objectKey: payload.objectKey,
    uploadUrl: payload.uploadUrl,
    headers: payload.headers as Record<string, string>,
  }
}

/**
 * Upload the raw file body directly to S3.
 *
 * XMLHttpRequest is used because fetch does not provide
 * conventional upload progress events.
 */
function uploadToS3(
  file: File,
  uploadUrl: string,
  headers: Record<string, string>,
  signal: AbortSignal,
  onProgress?: (percentage: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException("Upload aborted.", "AbortError"))
      return
    }

    const xhr = new XMLHttpRequest()

    const cleanup = () => {
      signal.removeEventListener("abort", handleAbort)
    }

    const handleAbort = () => {
      xhr.abort()
    }

    const fail = (error: Error) => {
      cleanup()
      reject(error)
    }

    xhr.open("PUT", uploadUrl)

    // These must match the headers used when signing the URL.
    for (const [name, value] of Object.entries(headers)) {
      xhr.setRequestHeader(name, value)
    }

    xhr.upload.addEventListener("progress", (event) => {
      const total = event.lengthComputable ? event.total : file.size

      if (total > 0) {
        const percentage = Math.min(
          100,
          Math.round((event.loaded / total) * 100)
        )

        onProgress?.(percentage)
      }
    })

    xhr.addEventListener(
      "load",
      () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          cleanup()
          resolve()
          return
        }

        fail(
          new UploadApiError("Amazon S3 rejected the file upload.", xhr.status)
        )
      },
      { once: true }
    )

    xhr.addEventListener(
      "error",
      () => {
        fail(
          new UploadApiError(
            "Unable to upload the document to storage. Check your connection and S3 CORS configuration."
          )
        )
      },
      { once: true }
    )

    xhr.addEventListener(
      "abort",
      () => {
        fail(new DOMException("Upload aborted.", "AbortError"))
      },
      { once: true }
    )

    signal.addEventListener("abort", handleAbort, { once: true })

    if (signal.aborted) {
      handleAbort()
      return
    }

    try {
      // Send the File directly. No FormData and no API Gateway.
      xhr.send(file)
    } catch {
      fail(new UploadApiError("Unable to start the S3 upload."))
    }
  })
}
async function confirmUpload(
  uploadId: string,
  filename: string,
  signal: AbortSignal
): Promise<void> {
  const url =
    `${API_URL}/documents/upload/` +
    `${encodeURIComponent(uploadId)}/complete` +
    `?filename=${encodeURIComponent(filename)}`

  const response = await apiRequest(url, {
    method: "POST",
    signal,
  })

  if (!response.ok) {
    throw new UploadApiError(
      getHttpErrorMessage(response.status),
      response.status
    )
  }
}

export async function uploadDocument(
  file: File,
  signal: AbortSignal,
  callbacks: UploadCallbacks = {}
): Promise<UploadResult> {
  callbacks.onStage?.("initializing")

  // 1. Ask the backend to initialize the upload.
  const upload = await initializeUpload(file, signal)

  callbacks.onStage?.("uploading")

  // 2. Upload directly to S3.
  await uploadToS3(
    file,
    upload.uploadUrl,
    upload.headers,
    signal,
    callbacks.onProgress
  )

  callbacks.onStage?.("confirming")

  // 3. Ask the backend to verify and finalize the upload.
  await confirmUpload(upload.uploadId, file.name, signal)

  return {
    uploadId: upload.uploadId,
    objectKey: upload.objectKey,
    status: "uploaded",
  }
}
