import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { SecurityValidator } from "../SecurityValidator";
import { ValidationError } from "../../errors/AppErrors";

const VALID_FILE = { name: "page.png", size: 1024, type: "image/png" };

describe("SecurityValidator.validateEnvironment", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("passes when GEMINI_API_KEY is a valid non-public key", () => {
    vi.stubEnv("GEMINI_API_KEY", "AIzaSyValidKey123");
    expect(() => SecurityValidator.validateEnvironment()).not.toThrow();
  });

  it("throws when GEMINI_API_KEY is missing", () => {
    vi.stubEnv("GEMINI_API_KEY", "");
    expect(() => SecurityValidator.validateEnvironment()).toThrow(ValidationError);
  });

  it("throws when GEMINI_API_KEY is only whitespace", () => {
    vi.stubEnv("GEMINI_API_KEY", "   ");
    expect(() => SecurityValidator.validateEnvironment()).toThrow(ValidationError);
  });

  it("throws when GEMINI_API_KEY starts with NEXT_PUBLIC_", () => {
    vi.stubEnv("GEMINI_API_KEY", "NEXT_PUBLIC_secret");
    expect(() => SecurityValidator.validateEnvironment()).toThrow(ValidationError);
  });
});

describe("SecurityValidator.validateFiles", () => {
  it("passes for a single valid PNG", () => {
    expect(() => SecurityValidator.validateFiles([VALID_FILE])).not.toThrow();
  });

  it("throws when file list is empty", () => {
    expect(() => SecurityValidator.validateFiles([])).toThrow(ValidationError);
  });

  it("throws when more than 10 files are provided", () => {
    const files = Array.from({ length: 11 }, (_, i) => ({
      name: `page${i}.png`,
      size: 100,
      type: "image/png",
    }));
    expect(() => SecurityValidator.validateFiles(files)).toThrow(ValidationError);
  });

  it("throws for a disallowed extension", () => {
    expect(() =>
      SecurityValidator.validateFiles([{ name: "shell.php", size: 100, type: "image/png" }])
    ).toThrow(ValidationError);
  });

  it("throws for a disallowed MIME type", () => {
    expect(() =>
      SecurityValidator.validateFiles([{ name: "page.png", size: 100, type: "application/octet-stream" }])
    ).toThrow(ValidationError);
  });

  it("throws when a single file exceeds 5MB", () => {
    const tooBig = { name: "big.png", size: 5 * 1024 * 1024 + 1, type: "image/png" };
    expect(() => SecurityValidator.validateFiles([tooBig])).toThrow(ValidationError);
  });

  it("throws when total batch size exceeds 20MB", () => {
    const chunk = { name: "chunk.png", size: 5 * 1024 * 1024, type: "image/png" };
    const files = [chunk, chunk, chunk, chunk, chunk]; // 25MB total
    expect(() => SecurityValidator.validateFiles(files)).toThrow(ValidationError);
  });

  it("accepts all allowed extensions", () => {
    const extensions = ["png", "jpg", "jpeg", "gif", "webp"];
    const mimes: Record<string, string> = {
      png: "image/png",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      gif: "image/gif",
      webp: "image/webp",
    };
    for (const ext of extensions) {
      expect(() =>
        SecurityValidator.validateFiles([{ name: `file.${ext}`, size: 100, type: mimes[ext] }])
      ).not.toThrow();
    }
  });
});
