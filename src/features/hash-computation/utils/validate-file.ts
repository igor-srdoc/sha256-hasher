import { MAX_FILE_SIZE_BYTES, MESSAGES } from "../hash-computation.const";

/**
 * Validate file size
 * @param file File to validate
 * @returns Error message if invalid, null if valid
 */
export function validateFile(file: File): string | null {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return MESSAGES.ERRORS.FILE_TOO_LARGE;
  }

  return null;
}

