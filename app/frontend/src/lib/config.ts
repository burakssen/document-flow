const DEFAULT_MAX_UPLOAD_BYTES = 25 * 1024 * 1024
const DEFAULT_UPLOAD_TIMEOUT_MS = 120_000

function positiveIntegerOrDefault(
  value: string | undefined,
  fallback: number
): number {
  const parsed = Number(value)

  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback
}

export const API_URL = (import.meta.env.VITE_API_URL ?? "/api").replace(
  /\/+$/,
  ""
)

export const MAX_UPLOAD_BYTES = positiveIntegerOrDefault(
  import.meta.env.VITE_MAX_UPLOAD_BYTES,
  DEFAULT_MAX_UPLOAD_BYTES
)

export const UPLOAD_TIMEOUT_MS = positiveIntegerOrDefault(
  import.meta.env.VITE_UPLOAD_TIMEOUT_MS,
  DEFAULT_UPLOAD_TIMEOUT_MS
)

export const ACCEPTED_FILE_TYPES =
  import.meta.env.VITE_ALLOWED_FILE_TYPES?.trim() || ".pdf,.doc,.docx,.txt"

export const COGNITO_USER_POOL_ID =
  import.meta.env.VITE_COGNITO_USER_POOL_ID ?? ""
export const COGNITO_CLIENT_ID = import.meta.env.VITE_COGNITO_CLIENT_ID ?? ""
export const COGNITO_REGION =
  import.meta.env.VITE_COGNITO_REGION ?? "eu-central-1"
export const COGNITO_ENDPOINT =
  import.meta.env.VITE_COGNITO_ENDPOINT ?? undefined
