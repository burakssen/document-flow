import { useId, type ChangeEvent } from "react"

import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"

import { Input } from "@/components/ui/input"

import { ACCEPTED_FILE_TYPES, MAX_UPLOAD_BYTES } from "@/lib/config"

import { formatFileSize } from "@/features/documents/file-validation"

interface DocumentPickerProps {
  file: File | null
  onFileSelect: (file: File | null) => void
  disabled?: boolean
  error?: string | null
}

export function DocumentPicker({
  file,
  onFileSelect,
  disabled = false,
  error = null,
}: DocumentPickerProps) {
  const inputId = useId()
  const descriptionId = `${inputId}-description`
  const errorId = `${inputId}-error`

  const describedBy = error ? `${descriptionId} ${errorId}` : descriptionId

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.currentTarget.files?.[0] ?? null

    onFileSelect(selectedFile)
  }

  return (
    <Field>
      <FieldLabel htmlFor={inputId}>Document</FieldLabel>

      <Input
        id={inputId}
        type="file"
        accept={ACCEPTED_FILE_TYPES}
        disabled={disabled}
        onChange={handleChange}
        aria-describedby={describedBy}
        aria-invalid={Boolean(error)}
      />

      <FieldDescription id={descriptionId}>
        Accepted formats: {ACCEPTED_FILE_TYPES}. Maximum size:{" "}
        {formatFileSize(MAX_UPLOAD_BYTES)}.
      </FieldDescription>

      {file && (
        <p className="text-sm text-muted-foreground">
          Selected: {file.name} ({formatFileSize(file.size)})
        </p>
      )}

      {error && (
        <p id={errorId} role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </Field>
  )
}
