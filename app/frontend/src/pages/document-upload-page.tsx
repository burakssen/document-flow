import { useState, type SubmitEvent } from "react"

import { DocumentPicker } from "@/components/document-picker"
import { Button } from "@/components/ui/button"

import { validateDocument } from "@/features/documents/file-validation"
import { useDocumentUpload } from "@/features/documents/use-document-upload"

export function DocumentUploadPage() {
  const [file, setFile] = useState<File | null>(null)
  const [pickerKey, setPickerKey] = useState(0)
  const [validationError, setValidationError] = useState<string | null>(null)

  const {
    status,
    error: uploadError,
    progress,
    result,
    upload,
    cancel,
    reset,
  } = useDocumentUpload()

  const isBusy =
    status === "initializing" ||
    status === "uploading" ||
    status === "confirming"

  const error = validationError ?? uploadError

  function handleFileSelect(selectedFile: File | null) {
    setFile(selectedFile)
    setValidationError(null)
    reset()
  }

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!file || isBusy || status === "success") {
      return
    }

    const validationMessage = validateDocument(file)

    if (validationMessage) {
      setValidationError(validationMessage)
      return
    }

    setValidationError(null)
    await upload(file)
  }

  function handleClearSelection() {
    if (isBusy) {
      return
    }

    setFile(null)
    setValidationError(null)
    reset()
    setPickerKey((current) => current + 1)
  }

  return (
    <main className="flex min-h-svh w-full flex-col items-center justify-center gap-4 p-6">
      <form
        onSubmit={handleSubmit}
        aria-busy={isBusy}
        className="w-full max-w-md space-y-4"
      >
        <DocumentPicker
          key={pickerKey}
          file={file}
          onFileSelect={handleFileSelect}
          disabled={isBusy}
          error={error}
        />

        {status === "initializing" && (
          <p role="status" className="text-sm text-muted-foreground">
            Preparing secure upload...
          </p>
        )}

        {status === "uploading" && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Uploading directly to S3</span>
              <span>{progress}%</span>
            </div>

            <progress
              value={progress}
              max={100}
              aria-label="File upload progress"
              className="w-full"
            />
          </div>
        )}

        {status === "confirming" && (
          <p role="status" className="text-sm text-muted-foreground">
            Verifying uploaded document...
          </p>
        )}

        {isBusy ? (
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={cancel}
          >
            Cancel upload
          </Button>
        ) : (
          <Button
            type="submit"
            className="w-full"
            disabled={!file || status === "success"}
          >
            {status === "success" ? "Uploaded" : "Upload document"}
          </Button>
        )}

        {file && !isBusy && (
          <Button
            type="button"
            variant="ghost"
            className="w-full"
            onClick={handleClearSelection}
          >
            Clear selection
          </Button>
        )}

        {status === "success" && (
          <div
            role="status"
            aria-live="polite"
            className="space-y-1 text-sm text-green-600"
          >
            <p>Document uploaded successfully.</p>

            {result && (
              <p className="break-all text-xs text-muted-foreground">
                Upload ID: {result.uploadId}
              </p>
            )}
          </div>
        )}
      </form>
    </main>
  )
}
