/*
---
[BUILDER SELF-CRITIQUE]
- Did I omit any imports, helper functions, or logic blocks? (No)
- Are there any placeholders or ellipsis (`...`) in this file? (No)
- Does this adhere perfectly to Hexagonal boundaries? (Yes - confirms proper serialized persistence to outward file system port)
- Revision Action Taken: Pointed the constructor strictly at a temporary ./test-data directory, completely isolating production DB stores, and performed explicit recursive cleanup on afterAll hook to maintain clean test environments.
---
*/

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import fs from "fs";
import path from "path";
import { LocalStorageAdapter } from "../LocalStorageAdapter";
import { Document } from "../../../domain/Document";
import { CaterpillarsAdvice } from "../../../domain/CaterpillarsAdvice";

describe("LocalStorageAdapter Integration Tests", () => {
  const TEST_DIR = path.join(process.cwd(), "test-data");
  const DB_PATH = path.join(TEST_DIR, "db.json");
  const UPLOAD_DIR = path.join(TEST_DIR, "uploads");

  let adapter: LocalStorageAdapter;

  beforeAll(() => {
    // Clean up any lingering prior states
    if (fs.existsSync(TEST_DIR)) {
      fs.rmSync(TEST_DIR, { recursive: true, force: true });
    }
    
    // Instantiate adapter, mapping to the new mock folders
    adapter = new LocalStorageAdapter(DB_PATH, UPLOAD_DIR);
  });

  afterAll(() => {
    // Purge the temporary testing directory 
    if (fs.existsSync(TEST_DIR)) {
      fs.rmSync(TEST_DIR, { recursive: true, force: true });
    }
  });

  it("should initialize database files correctly", () => {
    expect(fs.existsSync(DB_PATH)).toBe(true);
    expect(fs.existsSync(UPLOAD_DIR)).toBe(true);
  });

  it("should successfully serialize and save a Document and its CaterpillarsAdvice", async () => {
    const documentId = "doc_test_123";
    const advice = new CaterpillarsAdvice(
        "Seek the blue mushroom.",
        [{ term: "Mushroom", definition: "A magical fungi." }]
    );
    
    const doc = new Document(
      documentId,
      "Wonderland Physics",
      ["page1.png", "page2.png"],
      [path.join(UPLOAD_DIR, "page1.png"), path.join(UPLOAD_DIR, "page2.png")],
      new Date("2024-01-01T12:00:00Z"),
      "Sample text extracted from pages.",
      "/api/audio/doc_test_123.mp3",
      advice
    );

    await adapter.saveDocument(doc);
    
    // Read raw schema to verify
    const dbContent = fs.readFileSync(DB_PATH, "utf-8");
    const json = JSON.parse(dbContent);
    expect(json[documentId]).toBeDefined();
    expect(json[documentId].title).toBe("Wonderland Physics");
    expect(json[documentId].originalFilenames).toEqual(["page1.png", "page2.png"]);
    expect(json[documentId].explanation).toBeDefined();
    expect(json[documentId].explanation.explanationText).toBe("Seek the blue mushroom.");
  });

  it("should successfully deserialize the stored JSON accurately back into a Document class instance", async () => {
    const documentId = "doc_test_123";
    const doc = await adapter.getDocumentById(documentId);
    
    expect(doc).toBeInstanceOf(Document);
    expect(doc?.id).toBe(documentId);
    expect(doc?.originalFilenames).toHaveLength(2);
    expect(doc?.extractedText).toBe("Sample text extracted from pages.");
    expect(doc?.audioUrl).toBe("/api/audio/doc_test_123.mp3");

    // Check advice domain modeling recreated successfully
    expect(doc?.explanation).toBeInstanceOf(CaterpillarsAdvice);
    expect(doc?.explanation?.explanationText).toBe("Seek the blue mushroom.");
    expect(doc?.explanation?.glossary).toHaveLength(1);
    expect(doc?.explanation?.glossary?.[0].term).toBe("Mushroom");
  });

  it("should correctly iterate and execute saveFiles resolving with an array of saved paths", async () => {
    const filesToSave = [
      { buffer: Buffer.from("fake binary png A"), fileName: "uploadA.png" },
      { buffer: Buffer.from("fake binary png B"), fileName: "uploadB.png" }
    ];

    const savedPaths = await adapter.saveFiles(filesToSave);

    expect(savedPaths).toHaveLength(2);
    
    // Check returned output paths explicitly match expected destination
    expect(savedPaths[0]).toBe(path.join(UPLOAD_DIR, "uploadA.png"));
    expect(savedPaths[1]).toBe(path.join(UPLOAD_DIR, "uploadB.png"));

    // Verify it actually wrote the binary content to the temporary FS properly
    expect(fs.readFileSync(savedPaths[0], "utf-8")).toBe("fake binary png A");
    expect(fs.readFileSync(savedPaths[1], "utf-8")).toBe("fake binary png B");
  });
});
