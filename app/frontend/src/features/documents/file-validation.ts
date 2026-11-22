import { ACCEPTED_FILE_TYPES, MAX_UPLOAD_BYTES } from "@/lib/config"

const ALLOWED_EXTENSIONS: ReadonlySet<string> = new Set(
  ACCEPTED_FILE_TYPES.split(",")
    .map((extension: string) => extension.trim().toLowerCase())
    .filter(Boolean)
)

export function validateDocument(file: File): string | null {
  if (file.size === 0) {
    return "The selected file is empty."
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return `The file exceeds the maximum size of ${formatFileSize(
      MAX_UPLOAD_BYTES
    )}.`
  }

  const extension = file.name.slice(file.name.lastIndexOf(".")).toLowerCase()

  if (!extension || !ALLOWED_EXTENSIONS.has(extension)) {
    return `Unsupported file type. Accepted formats: ${ACCEPTED_FILE_TYPES}.`
  }

  return null
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`
  }

  const units = ["KB", "MB", "GB", "TB"]

  let size = bytes / 1024
  let unitIndex = 0

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }

  return `${size.toFixed(size >= 10 ? 0 : 1)} ${units[unitIndex]}`
}
