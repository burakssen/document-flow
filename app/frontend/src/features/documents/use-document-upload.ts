import { useCallback, useEffect, useRef, useState } from "react"

import {
  isAbortError,
  UploadApiError,
  uploadDocument,
  type UploadResult,
  type UploadStage,
} from "./documents-api"

import { UPLOAD_TIMEOUT_MS } from "@/lib/config"

export type UploadStatus = "idle" | UploadStage | "success" | "error"

interface UseDocumentUploadResult {
  status: UploadStatus
  error: string | null
  progress: number
  result: UploadResult | null
  upload: (file: File) => Promise<void>
  cancel: () => void
  reset: () => void
}

export function useDocumentUpload(): UseDocumentUploadResult {
  const [status, setStatus] = useState<UploadStatus>("idle")
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<UploadResult | null>(null)

  const controllerRef = useRef<AbortController | null>(null)
  const mountedRef = useRef(false)

  useEffect(() => {
    mountedRef.current = true

    return () => {
      mountedRef.current = false
      controllerRef.current?.abort()
    }
  }, [])

  const upload = useCallback(async (file: File): Promise<void> => {
    if (controllerRef.current !== null) {
      return
    }

    const controller = new AbortController()
    controllerRef.current = controller

    let timedOut = false

    const timeoutId = window.setTimeout(() => {
      timedOut = true
      controller.abort()
    }, UPLOAD_TIMEOUT_MS)

    setStatus("initializing")
    setError(null)
    setProgress(0)
    setResult(null)

    try {
      const uploaded = await uploadDocument(file, controller.signal, {
        onStage: (stage) => {
          if (mountedRef.current) {
            setStatus(stage)
          }
        },

        onProgress: (percentage) => {
          if (mountedRef.current) {
            setProgress(percentage)
          }
        },
      })

      if (mountedRef.current) {
        setStatus("success")
        setProgress(100)
        setResult(uploaded)
      }
    } catch (cause) {
      if (!mountedRef.current) {
        return
      }

      if (timedOut) {
        setStatus("error")
        setError(
          "The upload timed out. Please check the upload status before retrying."
        )
      } else if (isAbortError(cause)) {
        setStatus("idle")
        setError(null)
      } else {
        setStatus("error")

        setError(
          cause instanceof UploadApiError
            ? cause.message
            : "An unexpected error occurred while uploading the document."
        )
      }
    } finally {
      window.clearTimeout(timeoutId)

      if (controllerRef.current === controller) {
        controllerRef.current = null
      }
    }
  }, [])

  const cancel = useCallback(() => {
    controllerRef.current?.abort()
  }, [])

  const reset = useCallback(() => {
    if (controllerRef.current !== null) {
      return
    }

    setStatus("idle")
    setError(null)
    setProgress(0)
    setResult(null)
  }, [])

  return {
    status,
    error,
    progress,
    result,
    upload,
    cancel,
    reset,
  }
}
