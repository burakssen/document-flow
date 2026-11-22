import { API_URL } from "@/lib/config"

const TOKEN_STORAGE_KEYS = {
  idToken: "df_id_token",
  accessToken: "df_access_token",
  refreshToken: "df_refresh_token",
} as const

export interface Tokens {
  idToken: string
  accessToken: string
  refreshToken?: string
}

export interface User {
  sub: string
  email: string
  emailVerified: boolean
}

function storeTokens(tokens: Tokens) {
  localStorage.setItem(TOKEN_STORAGE_KEYS.idToken, tokens.idToken)
  localStorage.setItem(TOKEN_STORAGE_KEYS.accessToken, tokens.accessToken)
  if (tokens.refreshToken) {
    localStorage.setItem(TOKEN_STORAGE_KEYS.refreshToken, tokens.refreshToken)
  }
}

function clearTokens() {
  localStorage.removeItem(TOKEN_STORAGE_KEYS.idToken)
  localStorage.removeItem(TOKEN_STORAGE_KEYS.accessToken)
  localStorage.removeItem(TOKEN_STORAGE_KEYS.refreshToken)
}

export function getStoredTokens(): Tokens | null {
  const idToken = localStorage.getItem(TOKEN_STORAGE_KEYS.idToken)
  const accessToken = localStorage.getItem(TOKEN_STORAGE_KEYS.accessToken)

  if (!idToken || !accessToken) {
    return null
  }

  return {
    idToken,
    accessToken,
    refreshToken:
      localStorage.getItem(TOKEN_STORAGE_KEYS.refreshToken) || undefined,
  }
}

export function getIdToken(): string | null {
  return localStorage.getItem(TOKEN_STORAGE_KEYS.idToken)
}

async function apiRequest<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    let detail = "Request failed."
    try {
      const payload = (await response.json()) as { detail?: unknown }
      detail = extractErrorDetail(payload.detail) || detail
    } catch {
      // ignore malformed error bodies
    }
    throw new Error(detail)
  }

  return (await response.json()) as T
}

function extractErrorDetail(detail: unknown): string | undefined {
  if (typeof detail === "string") {
    return detail
  }

  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) => {
        if (typeof item === "string") {
          return item
        }
        if (item && typeof item === "object" && "msg" in item) {
          return friendlyErrorMessage(String((item as { msg?: unknown }).msg))
        }
        return undefined
      })
      .filter((message): message is string => message !== undefined)
    if (messages.length > 0) {
      return messages.join(", ")
    }
    return undefined
  }

  if (detail && typeof detail === "object") {
    return JSON.stringify(detail)
  }

  return undefined
}

function friendlyErrorMessage(message: string): string {
  const lower = message.toLowerCase()

  if (lower.includes("field required")) {
    return "This field is required."
  }

  if (lower.includes("input should be a valid string")) {
    return "Invalid input."
  }

  if (lower.includes("at least 12 characters")) {
    return "Password must be at least 12 characters."
  }

  if (lower.includes("at least 1 character")) {
    return "This field is required."
  }

  if (lower.includes("email")) {
    return "Please enter a valid email address."
  }

  return message
}

/**
 * Register a new user via the backend (which calls Cognito server-side).
 */
export async function signUp(input: {
  email: string
  password: string
}): Promise<{ userSub: string }> {
  return apiRequest<{ userSub: string }>("/auth/signup", {
    email: input.email,
    password: input.password,
  })
}

/**
 * Sign in via the backend (which calls Cognito USER_PASSWORD_AUTH server-side).
 * Stores the returned tokens and returns them.
 */
export async function signIn(input: {
  email: string
  password: string
}): Promise<Tokens> {
  const tokens = await apiRequest<Tokens>("/auth/login", {
    email: input.email,
    password: input.password,
  })
  storeTokens(tokens)
  return tokens
}

/**
 * Clear the locally stored session.
 */
export function signOut() {
  clearTokens()
}

/**
 * Decode the ID token payload to expose the authenticated user.
 * No signature verification is performed here (that happens on the backend).
 */
export function getUserFromIdToken(): User | null {
  const idToken = getIdToken()
  if (!idToken) {
    return null
  }

  try {
    const payload = JSON.parse(atob(idToken.split(".")[1]))
    return {
      sub: payload.sub,
      email: payload.email,
      emailVerified:
        payload.email_verified === true || payload.email_verified === "true",
    }
  } catch {
    return null
  }
}
