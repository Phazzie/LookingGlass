/*
---
[BUILDER SELF-CRITIQUE]
- Did I omit any imports, helper functions, or logic blocks? (No)
- Are there any placeholders or ellipsis (`...`) in this file? (No)
- Does this adhere perfectly to Hexagonal boundaries? (Yes - tests service boundary logic by supplying mock adapter loops in-memory)
- Revision Action Taken: Crafted exact mocks for bulk saves, state caching checks, and metadata persistence validations, running test verifications for all core use cases.
---
*/

import { describe, it, expect, beforeEach } from "vitest";
import { DocumentService } from "../DocumentService";
import { Document } from "../../domain/Document";
import { CaterpillarsAdvice, GlossaryItem, FocusSessionLine } from "../../domain/CaterpillarsAdvice";

import { OcrPort } from "../../ports/outbound/OcrPort";
import { TtsPort } from "../../ports/outbound/TtsPort";
import { StoragePort } from "../../ports/outbound/StoragePort";
import { ExplanationPort } from "../../ports/outbound/ExplanationPort";

// --- Mock Ports Implementation ---

class MockOcrAdapter implements OcrPort {
  public extractedTextResult = "Extracted scholarly textbook paragraph content.";
  public shouldFail = false;

  public async extractText(fileBuffers: Buffer[]): Promise<string> {
    if (this.shouldFail) {
      throw new Error("Mock OCR error occurred.");
    }
    if (!fileBuffers || fileBuffers.length === 0) {
      return "";
    }
    return this.extractedTextResult;
  }
}

class MockTtsAdapter implements TtsPort {
  public synthesizedFileNameResult = "/uploads/doc_123.mp3";
  public shouldFail = false;

  public async synthesizeSpeech(text: string, outputFilename: string): Promise<string> {
    if (this.shouldFail) {
      throw new Error("Mock TTS error occurred.");
    }
    return this.synthesizedFileNameResult;
  }
}

class MockStorageAdapter implements StoragePort {
  public saveFilePathsResult: string[] = ["/uploads/page_1.png"];
  public documentsDb: Record<string, Document> = {};
  public shouldFail = false;

  public async saveFile(fileBuffer: Buffer, filename: string): Promise<string> {
    return `/uploads/${filename}`;
  }

  public async saveFiles(files: Array<{ buffer: Buffer; fileName: string }>): Promise<string[]> {
    if (this.shouldFail) {
      throw new Error("Mock storage failure during saveFiles.");
    }
    return files.map(f => `/uploads/${f.fileName}`);
  }

  public async saveDocument(document: Document): Promise<void> {
    if (this.shouldFail) {
      throw new Error("Mock storage failure during saveDocument.");
    }
    this.documentsDb[document.id] = document;
  }

  public async getDocumentById(id: string): Promise<Document | null> {
    return this.documentsDb[id] || null;
  }

  public async getAllDocuments(): Promise<Document[]> {
    return Object.values(this.documentsDb);
  }

  public async deleteDocument(id: string): Promise<void> {
    delete this.documentsDb[id];
  }
}

class MockExplanationAdapter implements ExplanationPort {
  public explanationTextResult = "Wise caterpillar explained text representation.";
  public glossaryResult: GlossaryItem[] = [
    { term: "Scholarly", definition: "Academic or intellectual in style" }
  ];
  public focusSessionScriptResult: FocusSessionLine[] = [
    { speaker: "Narrator", text: "Welcome to our storybook focus session." },
    { speaker: "Alice", text: "This text is so much easier to understand now!" }
  ];
  public shouldFail = false;

  public async generateExplanation(text: string, focusTimeMinutes?: number): Promise<CaterpillarsAdvice> {
    if (this.shouldFail) {
      throw new Error("Mock explanation error occurred.");
    }
    return new CaterpillarsAdvice(
      this.explanationTextResult + (focusTimeMinutes ? ` [Paced for ${focusTimeMinutes} mins]` : ""),
      this.glossaryResult,
      this.focusSessionScriptResult
    );
  }
}

// --- Test Suite ---

describe("DocumentService Orchestrator", () => {
  let ocrAdapter: MockOcrAdapter;
  let ttsAdapter: MockTtsAdapter;
  let storageAdapter: MockStorageAdapter;
  let explanationAdapter: MockExplanationAdapter;
  let service: DocumentService;

  beforeEach(() => {
    ocrAdapter = new MockOcrAdapter();
    ttsAdapter = new MockTtsAdapter();
    storageAdapter = new MockStorageAdapter();
    explanationAdapter = new MockExplanationAdapter();

    service = new DocumentService(
      ocrAdapter,
      ttsAdapter,
      storageAdapter,
      explanationAdapter
    );
  });

  describe("executeReadDocument Use Case", () => {
    it("should successfully process uploaded multiple textbook screen buffers synchronously", async () => {
      const requestPayload = {
        files: [
          { fileBuffer: Buffer.from("image payload page 1"), originalFilename: "philosophy_ch1_p1.png", mimeType: "image/png" },
          { fileBuffer: Buffer.from("image payload page 2"), originalFilename: "philosophy_ch1_p2.png", mimeType: "image/png" }
        ]
      };

      const doc = await service.execute(requestPayload);

      // Verify returned document layout details
      expect(doc).toBeInstanceOf(Document);
      expect(doc.id).toBeDefined();
      expect(doc.title).toBe("Philosophy_ch1_p1"); // Extracted title base
      expect(doc.originalFilenames).toHaveLength(2);
      expect(doc.originalFilenames[0]).toContain("_page_1.png");
      expect(doc.originalFilenames[1]).toContain("_page_2.png");
      expect(doc.filePaths).toHaveLength(2);
      expect(doc.filePaths[0]).toContain("/uploads/doc_");
      expect(doc.extractedText).toBe(ocrAdapter.extractedTextResult);
      expect(doc.audioUrl).toContain(`/api/audio/${doc.id}.mp3`);
      expect(doc.hasExplanation()).toBe(false);

      // Confirm storage database persistence
      const savedDoc = await storageAdapter.getDocumentById(doc.id);
      expect(savedDoc).not.toBeNull();
      expect(savedDoc?.id).toBe(doc.id);
    });

    it("should throw error if input files list is empty or completely missing", async () => {
      await expect(service.execute({ files: [] })).rejects.toThrow(
        "No textbook screenshots uploaded for processing."
      );
    });

    it("should throw error if OCR returns an empty transcript result", async () => {
      ocrAdapter.extractedTextResult = "   "; // whitespace or empty
      const payload = {
        files: [{ fileBuffer: Buffer.from("mock bytes"), originalFilename: "test.png", mimeType: "image/png" }]
      };

      await expect(service.execute(payload)).rejects.toThrow(
        "Unable to extract any text from the provided textbook page screenshots."
      );
    });
  });

  describe("executeExplanation (Consult the Caterpillar) Use Case", () => {
    let preExistingDoc: Document;

    beforeEach(async () => {
      preExistingDoc = new Document(
        "doc_existing_123",
        "Introduction to Philosophy",
        ["philosophy_ch1_p1.png"],
        ["/uploads/philosophy_ch1_p1.png"],
        new Date(),
        "Dense textbook text detailing metaphysics and scholastic epistemology."
      );
      await storageAdapter.saveDocument(preExistingDoc);
    });

    it("should generate and persist explanation advice successfully", async () => {
      const explainRequest = {
        documentId: "doc_existing_123"
      };

      const docWithExplanation = await service.executeExplainText(explainRequest);

      expect(docWithExplanation.hasExplanation()).toBe(true);
      expect(docWithExplanation.explanation?.explanationText).toContain(explanationAdapter.explanationTextResult);
      expect(docWithExplanation.explanation?.glossary).toEqual(explanationAdapter.glossaryResult);
      expect(docWithExplanation.explanation?.focusSessionScript).toEqual(explanationAdapter.focusSessionScriptResult);

      // Verify db cache persistence
      const updatedDocInDb = await storageAdapter.getDocumentById("doc_existing_123");
      expect(updatedDocInDb?.hasExplanation()).toBe(true);
    });

    it("should support a duration-boxed study session (The Mad Hatter's Tea Time)", async () => {
      const explainRequest = {
        documentId: "doc_existing_123",
        focusTimeMinutes: 10
      };

      const docWithExplanation = await service.executeExplainText(explainRequest);
      expect(docWithExplanation.explanation?.explanationText).toContain("[Paced for 10 mins]");
    });

    it("should serve explanation from cache instead of requesting new advice if explanation exists and focus session is unconfigured", async () => {
      // Pre-add explanation advice to cache
      const initialAdvice = new CaterpillarsAdvice("First advise explanation text.", []);
      preExistingDoc.setExplanation(initialAdvice);
      await storageAdapter.saveDocument(preExistingDoc);

      const explainRequest = {
        documentId: "doc_existing_123"
      };

      const resultDoc = await service.executeExplainText(explainRequest);
      expect(resultDoc.explanation?.explanationText).toBe("First advise explanation text.");
    });

    it("should throw error if matching Document is not found inside the storage library", async () => {
      await expect(service.executeExplainText({ documentId: "doc_unknown" })).rejects.toThrow(
        "Document with ID doc_unknown does not exist in our library."
      );
    });

    it("should throw error if document exists but has no extracted textbook text", async () => {
      const emptyTextDoc = new Document(
        "doc_empty_text",
        "Empty metaphysics lecture",
        ["lecture.png"],
        ["/uploads/lecture.png"],
        new Date()
      );
      await storageAdapter.saveDocument(emptyTextDoc);

      await expect(service.executeExplainText({ documentId: "doc_empty_text" })).rejects.toThrow(
        "Cannot consult the Caterpillar on an empty document text."
      );
    });
  });

  describe("Metadata Library Query Functions", () => {
    it("should call underlying storage to fetch documents by direct matching id", async () => {
      const id = "doc_search_999";
      const doc = new Document(id, "Caterpillar's Metaphysics", ["c.png"], ["/u/c.png"], new Date());
      await storageAdapter.saveDocument(doc);

      const fetchResult = await service.getById(id);
      expect(fetchResult).toBe(doc);

      const nullResult = await service.getById("doc_not_existent");
      expect(nullResult).toBeNull();
    });

    it("should call underlying storage to fetch all documents currently saved", async () => {
      const doc1 = new Document("d1", "Book 1", ["a.png"], ["/p1"], new Date());
      const doc2 = new Document("d2", "Book 2", ["b.png"], ["/p2"], new Date());
      await storageAdapter.saveDocument(doc1);
      await storageAdapter.saveDocument(doc2);

      const listResult = await service.getAll();
      expect(listResult).toContain(doc1);
      expect(listResult).toContain(doc2);
      expect(listResult).toHaveLength(2);
    });

    it("should delete document cleanly from database", async () => {
      const doc = new Document("todelete", "Will be removed", ["x.png"], ["/y"], new Date());
      await storageAdapter.saveDocument(doc);

      await service.delete("todelete");
      const fetched = await service.getById("todelete");
      expect(fetched).toBeNull();
    });
  });
});
