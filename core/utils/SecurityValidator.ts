import { ValidationError } from "../errors/AppErrors";

const ALLOWED_MIME_PREFIXES = ["image/png", "image/jpeg", "image/gif", "image/webp"];
const ALLOWED_EXTENSIONS = new Set(["png", "jpg", "jpeg", "gif", "webp"]);
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const MAX_TOTAL_SIZE_BYTES = 20 * 1024 * 1024;
const MAX_FILE_COUNT = 10;

export class SecurityValidator {
  static validateEnvironment(): void {
    const key = process.env.GEMINI_API_KEY;
    if (!key || key.trim() === "") {
      throw new ValidationError("GEMINI_API_KEY is not configured on this server.");
    }
    if (key.startsWith("NEXT_PUBLIC_")) {
      throw new ValidationError(
        "GEMINI_API_KEY must never be prefixed with NEXT_PUBLIC_ — this would expose it to the browser."
      );
    }
  }

  static validateFiles(
    files: Array<{ name: string; size: number; type: string }>
  ): void {
    if (!Array.isArray(files) || files.length === 0) {
      throw new ValidationError("No files were provided.");
    }
    if (files.length > MAX_FILE_COUNT) {
      throw new ValidationError(`Too many files. Maximum ${MAX_FILE_COUNT} per batch.`);
    }

    let totalSize = 0;
    for (const file of files) {
      const ext = (file.name.split(".").pop() ?? "").toLowerCase();
      if (!ALLOWED_EXTENSIONS.has(ext)) {
        throw new ValidationError(
          `File type .${ext} is not permitted. Allowed: png, jpg, jpeg, gif, webp.`
        );
      }
      const mimeOk = ALLOWED_MIME_PREFIXES.some((prefix) => file.type === prefix);
      if (!mimeOk) {
        throw new ValidationError(
          `MIME type "${file.type}" is not permitted for file "${file.name}".`
        );
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        throw new ValidationError(
          `File "${file.name}" exceeds the 5MB per-file limit.`
        );
      }
      totalSize += file.size;
      if (totalSize > MAX_TOTAL_SIZE_BYTES) {
        throw new ValidationError("Total batch size exceeds the 20MB limit.");
      }
    }
  }
}
