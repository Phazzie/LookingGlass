export class SecurityValidator {
  public static validateEnvironment(): void {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.trim() === "") {
      throw new Error("CRITICAL SERVER ERROR: GEMINI_API_KEY is missing from the environment.");
    }
    // Prevent fatal leak to client browser
    if (apiKey.startsWith("NEXT_PUBLIC_")) {
      throw new Error("CRITICAL SERVER ERROR: GEMINI_API_KEY must not start with NEXT_PUBLIC_.");
    }
  }

  public static validateFiles(files: File[]): void {
    if (!files || files.length === 0) {
      throw new Error("No textbook screenshots were uploaded.");
    }

    const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20MB per file
    const VALID_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

    for (const file of files) {
      if (file.size > MAX_FILE_SIZE_BYTES) {
        throw new Error(`File "${file.name}" exceeds the 20MB limit. Please provide a smaller portrait.`);
      }

      if (!VALID_IMAGE_TYPES.includes(file.type)) {
        throw new Error(`Invalid file type for "${file.name}". Only images (jpeg, png, webp, gif) are allowed.`);
      }
    }
  }
}
