/*
---
[BUILDER SELF-CRITIQUE]
- Did I omit any imports, helper functions, or logic blocks? (No)
- Are there any placeholders or ellipsis (`...`) in this file? (No)
- Does this adhere perfectly to Hexagonal boundaries? (Yes - storage implementation without leaking into domain)
- Revision Action Taken: Created PostgresStorageAdapter using drizzle-orm, explicitly validatating IDs and fetching before DB row unlink to clear physics resources safely. Implements StoragePort safely with userId filters.
---
*/

import fsPromises from "fs/promises";
import path from "path";
import { eq, and } from "drizzle-orm";
import { db } from "../../../db/index";
import { documents } from "../../../db/schema";
import { StoragePort } from "../../ports/outbound/StoragePort";
import { Document } from "../../domain/Document";
import { CaterpillarsAdvice, GlossaryItem, FocusSessionLine } from "../../domain/CaterpillarsAdvice";

export class PostgresStorageAdapter implements StoragePort {
  private readonly uploadDir: string;

  constructor(uploadDir: string) {
    if (!uploadDir || uploadDir.trim() === "") {
      throw new Error("Upload directory path cannot be empty.");
    }
    this.uploadDir = uploadDir;
  }

  private validateId(id: string): void {
    if (!/^[a-zA-Z0-9_-]+$/.test(id)) {
      throw new Error("Invalid ID format.");
    }
  }

  private rowToDocument(row: typeof documents.$inferSelect): Document {
    let explanation: CaterpillarsAdvice | undefined = undefined;

    if (row.explanationText) {
      explanation = new CaterpillarsAdvice(
        row.explanationText,
        (row.glossary as GlossaryItem[]) || [],
        (row.focusSessionScript as FocusSessionLine[]) || undefined
      );
    }

    return new Document(
      row.id,
      row.title,
      row.originalFilenames || [],
      row.filePaths || [],
      new Date(row.createdAt),
      row.extractedText || undefined,
      row.audioUrl || undefined,
      explanation,
      row.userId
    );
  }

  public async saveDocument(userId: string, document: Document): Promise<void> {
    this.validateId(document.id);

    const dataToInsert = {
      id: document.id,
      userId: userId,
      title: document.title,
      originalFilenames: document.originalFilenames,
      filePaths: document.filePaths,
      extractedText: document.extractedText || "",
      audioUrl: document.audioUrl,
      explanationText: document.explanation?.explanationText || null,
      glossary: document.explanation?.glossary || null,
      focusSessionScript: document.explanation?.focusSessionScript || null,
      createdAt: document.createdAt,
    };

    await db.insert(documents)
      .values(dataToInsert)
      .onConflictDoUpdate({
        target: documents.id,
        set: dataToInsert,
      });
  }

  public async getDocumentById(userId: string, id: string): Promise<Document | null> {
    this.validateId(id);

    const result = await db.select()
      .from(documents)
      .where(and(eq(documents.id, id), eq(documents.userId, userId)))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    return this.rowToDocument(result[0]);
  }

  public async getAllDocuments(userId: string): Promise<Document[]> {
    const results = await db.select()
      .from(documents)
      .where(eq(documents.userId, userId));

    return results.map(row => this.rowToDocument(row)).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  public async deleteDocument(userId: string, id: string): Promise<void> {
    this.validateId(id);

    const existingRecord = await this.getDocumentById(userId, id);
    if (!existingRecord) {
      return;
    }

    // Try deleting physical files first
    for (const filePath of existingRecord.filePaths) {
      if (filePath) {
        try {
          await fsPromises.unlink(filePath);
        } catch {
          // Ignore unlink errors
        }
      }
    }

    await db.delete(documents)
      .where(and(eq(documents.id, id), eq(documents.userId, userId)));
  }

  public async saveFile(fileBuffer: Buffer, filename: string): Promise<string> {
    if (!fileBuffer || fileBuffer.length === 0) {
      throw new Error("Cannot save an empty file buffer.");
    }
    if (!filename || filename.trim() === "") {
      throw new Error("Target file name cannot be empty.");
    }

    const destinationPath = path.join(this.uploadDir, filename);
    await fsPromises.writeFile(destinationPath, fileBuffer);
    return destinationPath;
  }

  public async saveFiles(files: Array<{ buffer: Buffer; fileName: string }>): Promise<string[]> {
    if (!Array.isArray(files) || files.length === 0) {
      throw new Error("Cannot save empty files payload.");
    }

    const savedFilesPaths: string[] = [];
    for (const file of files) {
      const savedPath = await this.saveFile(file.buffer, file.fileName);
      savedFilesPaths.push(savedPath);
    }
    return savedFilesPaths;
  }
}
