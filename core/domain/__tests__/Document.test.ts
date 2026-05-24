/*
---
[BUILDER SELF-CRITIQUE]
- Did I omit any imports, helper functions, or logic blocks? (No)
- Are there any placeholders or ellipsis (`...`) in this file? (No)
- Does this adhere perfectly to Hexagonal boundaries? (Yes - tests only the domain layer with pure TypeScript, zero side effects)
- Revision Action Taken: Formulated precise test coverage for multi-screenshot properties, array deep copying properties, and validation checks.
---
*/

import { describe, it, expect } from "vitest";
import { Document } from "../Document";
import { CaterpillarsAdvice } from "../CaterpillarsAdvice";

describe("Document Domain Entity", () => {
  const validId = "doc_123456";
  const validTitle = "Introduction to Philosophy";
  const validFilenames = ["page1.png", "page2.png"];
  const validFilePaths = ["/uploads/doc_page_1.png", "/uploads/doc_page_2.png"];
  const validDate = new Date();

  describe("Constructor & Instantiation Validations", () => {
    it("should successfully instantiate with valid parameters", () => {
      const doc = new Document(
        validId,
        validTitle,
        validFilenames,
        validFilePaths,
        validDate
      );

      expect(doc.id).toBe(validId);
      expect(doc.title).toBe(validTitle);
      expect(doc.originalFilenames).toEqual(validFilenames);
      expect(doc.filePaths).toEqual(validFilePaths);
      expect(doc.createdAt).toBe(validDate);
      expect(doc.extractedText).toBeUndefined();
      expect(doc.audioUrl).toBeUndefined();
      expect(doc.explanation).toBeUndefined();
      expect(doc.hasExplanation()).toBe(false);
    });

    it("should carry forward pre-populated properties if passed in constructor", () => {
      const advice = new CaterpillarsAdvice("Simple explanation", [{ term: "Apx", definition: "App" }]);
      const doc = new Document(
        validId,
        validTitle,
        validFilenames,
        validFilePaths,
        validDate,
        "Original Extract Text",
        "https://example.com/audio.mp3",
        advice
      );

      expect(doc.extractedText).toBe("Original Extract Text");
      expect(doc.audioUrl).toBe("https://example.com/audio.mp3");
      expect(doc.explanation).toBe(advice);
      expect(doc.hasExplanation()).toBe(true);
    });

    it("should copy filename and file path arrays to prevent direct modifications through reference", () => {
      const filenames = ["fileA.png", "fileB.png"];
      const filePaths = ["/path1", "/path2"];
      const doc = new Document(validId, validTitle, filenames, filePaths, validDate);

      // Mutate external arrays
      filenames.push("fileC.png");
      filePaths.push("/path3");

      expect(doc.originalFilenames).toEqual(["fileA.png", "fileB.png"]);
      expect(doc.filePaths).toEqual(["/path1", "/path2"]);
    });

    it("should throw error if ID is empty", () => {
      expect(() => {
        new Document("", validTitle, validFilenames, validFilePaths, validDate);
      }).toThrow("Document ID cannot be empty.");

      expect(() => {
        new Document(" ", validTitle, validFilenames, validFilePaths, validDate);
      }).toThrow("Document ID cannot be empty.");
    });

    it("should throw error if title is empty", () => {
      expect(() => {
        new Document(validId, "", validFilenames, validFilePaths, validDate);
      }).toThrow("Document title cannot be empty.");

      expect(() => {
        new Document(validId, "  ", validFilenames, validFilePaths, validDate);
      }).toThrow("Document title cannot be empty.");
    });

    it("should throw error if originalFilenames is not a valid non-empty array", () => {
      expect(() => {
        new Document(validId, validTitle, [], validFilePaths, validDate);
      }).toThrow("Document must have at least one original filename.");

      expect(() => {
        new Document(validId, validTitle, ["page1.png", ""], validFilePaths, validDate);
      }).toThrow("Original filename elements cannot be empty.");
    });

    it("should throw error if filePaths is not a valid non-empty array", () => {
      expect(() => {
        new Document(validId, validTitle, validFilenames, [], validDate);
      }).toThrow("Document must have at least one file path.");

      expect(() => {
        new Document(validId, validTitle, validFilenames, ["/path", "   "], validDate);
      }).toThrow("File path elements cannot be empty.");
    });

    it("should throw error if creation date is invalid", () => {
      expect(() => {
        new Document(validId, validTitle, validFilenames, validFilePaths, new Date("invalid-date-string"));
      }).toThrow("A valid creation date is required.");
    });
  });

  describe("State Mutation Methods", () => {
    it("should set and trim extracted text securely", () => {
      const doc = new Document(validId, validTitle, validFilenames, validFilePaths, validDate);
      doc.setExtractedText("   Extracted dense scholars text... ");
      expect(doc.extractedText).toBe("Extracted dense scholars text...");
    });

    it("should throw when setting empty extracted text", () => {
      const doc = new Document(validId, validTitle, validFilenames, validFilePaths, validDate);
      expect(() => {
        doc.setExtractedText("");
      }).toThrow("Extracted text cannot be empty.");

      expect(() => {
        doc.setExtractedText("  ");
      }).toThrow("Extracted text cannot be empty.");
    });

    it("should set audio URL cleanly", () => {
      const doc = new Document(validId, validTitle, validFilenames, validFilePaths, validDate);
      doc.setAudioUrl(" /api/audio/123.mp3  ");
      expect(doc.audioUrl).toBe("/api/audio/123.mp3");
    });

    it("should throw when setting empty audio URL", () => {
      const doc = new Document(validId, validTitle, validFilenames, validFilePaths, validDate);
      expect(() => {
        doc.setAudioUrl("");
      }).toThrow("Audio URL cannot be empty.");
    });

    it("should set CaterpillarsAdvice explanation cleanly", () => {
      const doc = new Document(validId, validTitle, validFilenames, validFilePaths, validDate);
      const advice = new CaterpillarsAdvice("Translated text", []);
      doc.setExplanation(advice);

      expect(doc.explanation).toBe(advice);
      expect(doc.hasExplanation()).toBe(true);
    });

    it("should throw when setting null or undefined explanation", () => {
      const doc = new Document(validId, validTitle, validFilenames, validFilePaths, validDate);
      expect(() => {
        doc.setExplanation(null as any);
      }).toThrow("Explanation advice cannot be null or undefined.");

      expect(() => {
        doc.setExplanation(undefined as any);
      }).toThrow("Explanation advice cannot be null or undefined.");
    });
  });
});
