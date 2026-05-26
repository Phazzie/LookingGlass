import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs";
import path from "path";
import os from "os";
import { LocalStorageAdapter } from "../LocalStorageAdapter";
import { Document } from "../../../domain/Document";
import { CaterpillarsAdvice } from "../../../domain/CaterpillarsAdvice";

const USER_ID = "user-abc";

function makeAdapter(tmpDir: string): LocalStorageAdapter {
  return new LocalStorageAdapter(
    path.join(tmpDir, "db.json"),
    path.join(tmpDir, "uploads"),
    path.join(tmpDir, "audio")
  );
}

function makeDocument(id = "doc-1", userId = USER_ID): Document {
  return new Document(
    id,
    "Test Title",
    ["page1.png"],
    ["/tmp/page1.png"],
    new Date("2024-01-01T00:00:00.000Z"),
    "Extracted text here.",
    undefined,
    undefined,
    userId
  );
}

describe("LocalStorageAdapter", () => {
  let tmpDir: string;
  let adapter: LocalStorageAdapter;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "looking-glass-test-"));
    adapter = makeAdapter(tmpDir);
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  describe("constructor", () => {
    it("creates upload and audio directories if they do not exist", () => {
      expect(fs.existsSync(path.join(tmpDir, "uploads"))).toBe(true);
      expect(fs.existsSync(path.join(tmpDir, "audio"))).toBe(true);
    });

    it("initialises an empty db.json", () => {
      const content = fs.readFileSync(path.join(tmpDir, "db.json"), "utf-8");
      expect(JSON.parse(content)).toEqual({});
    });
  });

  describe("saveDocument / getDocumentById", () => {
    it("persists and retrieves a document", async () => {
      const doc = makeDocument();
      await adapter.saveDocument(doc);
      const retrieved = await adapter.getDocumentById("doc-1", USER_ID);
      expect(retrieved).not.toBeNull();
      expect(retrieved!.id).toBe("doc-1");
      expect(retrieved!.title).toBe("Test Title");
      expect(retrieved!.userId).toBe(USER_ID);
    });

    it("returns null for a non-existent ID", async () => {
      const result = await adapter.getDocumentById("no-such-id", USER_ID);
      expect(result).toBeNull();
    });

    it("returns null when the userId does not match", async () => {
      await adapter.saveDocument(makeDocument("doc-1", USER_ID));
      const result = await adapter.getDocumentById("doc-1", "other-user");
      expect(result).toBeNull();
    });

    it("returns null for IDs with invalid characters (prototype pollution guard)", async () => {
      const result = await adapter.getDocumentById("__proto__", USER_ID);
      expect(result).toBeNull();
    });

    it("persists and deserializes CaterpillarsAdvice", async () => {
      const advice = new CaterpillarsAdvice(
        "Here is the explanation.",
        [{ term: "Osmosis", definition: "Water movement across a membrane." }],
        [{ speaker: "Alice", text: "Oh, I see!" }]
      );
      const doc = makeDocument();
      doc.setExplanation(advice);
      await adapter.saveDocument(doc);

      const retrieved = await adapter.getDocumentById("doc-1", USER_ID);
      expect(retrieved!.explanation).not.toBeNull();
      expect(retrieved!.explanation!.explanationText).toBe("Here is the explanation.");
      expect(retrieved!.explanation!.glossary[0].term).toBe("Osmosis");
      expect(retrieved!.explanation!.focusSessionScript![0].speaker).toBe("Alice");
    });

    it("overwrites an existing document on re-save", async () => {
      const doc = makeDocument();
      await adapter.saveDocument(doc);
      doc.setAudioUrl("/api/audio/doc-1.mp3");
      await adapter.saveDocument(doc);

      const retrieved = await adapter.getDocumentById("doc-1", USER_ID);
      expect(retrieved!.audioUrl).toBe("/api/audio/doc-1.mp3");
    });
  });

  describe("getAllDocuments", () => {
    it("returns only documents belonging to the requesting user", async () => {
      await adapter.saveDocument(makeDocument("doc-a", USER_ID));
      await adapter.saveDocument(makeDocument("doc-b", "other-user"));
      const results = await adapter.getAllDocuments(USER_ID);
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe("doc-a");
    });

    it("returns an empty array when user has no documents", async () => {
      const results = await adapter.getAllDocuments("nobody");
      expect(results).toEqual([]);
    });

    it("returns documents sorted newest first", async () => {
      const older = new Document("doc-old", "Old", ["p.png"], ["/tmp/p.png"], new Date("2024-01-01"), "t", undefined, undefined, USER_ID);
      const newer = new Document("doc-new", "New", ["p.png"], ["/tmp/p.png"], new Date("2024-06-01"), "t", undefined, undefined, USER_ID);
      await adapter.saveDocument(older);
      await adapter.saveDocument(newer);

      const results = await adapter.getAllDocuments(USER_ID);
      expect(results[0].id).toBe("doc-new");
      expect(results[1].id).toBe("doc-old");
    });
  });

  describe("deleteDocument", () => {
    it("removes the document record", async () => {
      await adapter.saveDocument(makeDocument());
      await adapter.deleteDocument("doc-1", USER_ID);
      const result = await adapter.getDocumentById("doc-1", USER_ID);
      expect(result).toBeNull();
    });

    it("is a no-op when the document does not exist", async () => {
      await expect(adapter.deleteDocument("ghost", USER_ID)).resolves.toBeUndefined();
    });

    it("does not delete a document owned by another user", async () => {
      await adapter.saveDocument(makeDocument("doc-1", USER_ID));
      await adapter.deleteDocument("doc-1", "attacker");
      const result = await adapter.getDocumentById("doc-1", USER_ID);
      expect(result).not.toBeNull();
    });

    it("deletes associated upload files", async () => {
      const uploadPath = path.join(tmpDir, "uploads", "doc-1_page_1.png");
      fs.writeFileSync(uploadPath, "fake-image");

      const doc = new Document(
        "doc-1",
        "Title",
        ["doc-1_page_1.png"],
        [uploadPath],
        new Date(),
        "txt",
        undefined,
        undefined,
        USER_ID
      );
      await adapter.saveDocument(doc);
      await adapter.deleteDocument("doc-1", USER_ID);

      expect(fs.existsSync(uploadPath)).toBe(false);
    });
  });

  describe("saveFile", () => {
    it("writes a file to the upload directory and returns its path", async () => {
      const buf = Buffer.from("fake-png-data");
      const resultPath = await adapter.saveFile(buf, "test.png");
      expect(fs.existsSync(resultPath)).toBe(true);
    });

    it("rejects disallowed extensions", async () => {
      await expect(adapter.saveFile(Buffer.from("data"), "evil.exe")).rejects.toThrow();
    });
  });

  describe("write queue (concurrency)", () => {
    it("serialises concurrent saves without data loss", async () => {
      const docs = Array.from({ length: 5 }, (_, i) => makeDocument(`doc-${i}`));
      await Promise.all(docs.map((d) => adapter.saveDocument(d)));
      const all = await adapter.getAllDocuments(USER_ID);
      expect(all).toHaveLength(5);
    });
  });
});
