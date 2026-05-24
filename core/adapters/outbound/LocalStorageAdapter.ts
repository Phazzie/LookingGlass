/*
---
[BUILDER SELF-CRITIQUE]
- Did I omit any imports, helper functions, or logic blocks? (No)
- Are there any placeholders or ellipsis (`...`) in this file? (No)
- Does this adhere perfectly to Hexagonal boundaries? (Yes - implements the updated StoragePort outbound port interface completely)
- Revision Action Taken: Implemented saveFiles to write arrays of Buffers in sequential order, updated serialization/deserialization to work with arrays of originalFilenames and filePaths while keeping robust backwards compatibility mapping.
---
*/

import fs from "fs";
import fsPromises from "fs/promises";
import path from "path";
import { StoragePort } from "../../ports/outbound/StoragePort";
import { Document } from "../../domain/Document";
import { CaterpillarsAdvice, GlossaryItem } from "../../domain/CaterpillarsAdvice";

interface SerializedAdvice {
  explanationText: string;
  glossary: GlossaryItem[];
  focusSessionScript?: Array<{ speaker: "Narrator" | "Alice"; text: string }>;
}

interface SerializedDocument {
  id: string;
  title: string;
  originalFilename?: string; // legacy support
  originalFilenames?: string[];
  filePaths?: string[];
  extractedText?: string;
  audioUrl?: string;
  createdAt: string;
  explanation?: SerializedAdvice;
}

interface DatabaseSchema {
  [id: string]: SerializedDocument;
}

export class LocalStorageAdapter implements StoragePort {
  private readonly dbPath: string;
  private readonly uploadDir: string;

  constructor(dbPath: string, uploadDir: string) {
    if (!dbPath || dbPath.trim() === "") {
      throw new Error("Database path cannot be empty.");
    }
    if (!uploadDir || uploadDir.trim() === "") {
      throw new Error("Upload directory path cannot be empty.");
    }

    this.dbPath = dbPath;
    this.uploadDir = uploadDir;

    // 1. Ensure the upload file storage directory exists
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }

    // 2. Ensure database directory and file exist
    const dbDir = path.dirname(this.dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    if (!fs.existsSync(this.dbPath)) {
      fs.writeFileSync(this.dbPath, "{}", { encoding: "utf-8" });
    }
  }

  /**
   * Helper method to read database safely asynchronously
   */
  private async readDatabase(): Promise<DatabaseSchema> {
    try {
      const content = await fsPromises.readFile(this.dbPath, "utf-8");
      return JSON.parse(content) as DatabaseSchema;
    } catch {
      return {};
    }
  }

  /**
   * Helper method to write database safely asynchronously
   */
  private async writeDatabase(data: DatabaseSchema): Promise<void> {
    const content = JSON.stringify(data, null, 2);
    await fsPromises.writeFile(this.dbPath, content, "utf-8");
  }

  /**
   * Saves uploaded binary images (screenshots) to local disk.
   */
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

  /**
   * Saves multiple biological screenshot files to local public uploads.
   */
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

  /**
   * Serializes and persists/updates a Document record in the flat-file database.
   */
  public async saveDocument(document: Document): Promise<void> {
    if (!document) {
      throw new Error("Document cannot be null or undefined.");
    }

    const db = await this.readDatabase();

    let serializedExplanation: SerializedAdvice | undefined;
    if (document.explanation) {
      serializedExplanation = {
        explanationText: document.explanation.explanationText,
        glossary: document.explanation.glossary,
        focusSessionScript: document.explanation.focusSessionScript
      };
    }

    const serializedDoc: SerializedDocument = {
      id: document.id,
      title: document.title,
      originalFilename: document.originalFilenames[0] || "", // Keep legacy single field filled
      originalFilenames: document.originalFilenames,
      filePaths: document.filePaths,
      extractedText: document.extractedText,
      audioUrl: document.audioUrl,
      createdAt: document.createdAt.toISOString(),
      explanation: serializedExplanation
    };

    db[document.id] = serializedDoc;
    await this.writeDatabase(db);
  }

  /**
   * Retrieves a document from disk and reconstructs its domain object representation.
   */
  public async getDocumentById(id: string): Promise<Document | null> {
    if (!id || id.trim() === "") {
      return null;
    }

    const db = await this.readDatabase();
    const docRecord = db[id];

    if (!docRecord) {
      return null;
    }

    let domainExplanation: CaterpillarsAdvice | undefined;
    if (docRecord.explanation) {
      domainExplanation = new CaterpillarsAdvice(
        docRecord.explanation.explanationText,
        docRecord.explanation.glossary,
        docRecord.explanation.focusSessionScript
      );
    }

    const originalFilenames = docRecord.originalFilenames || (docRecord.originalFilename ? [docRecord.originalFilename] : []);
    const filePaths = docRecord.filePaths || (docRecord.originalFilename ? [path.join(this.uploadDir, docRecord.originalFilename)] : []);

    return new Document(
      docRecord.id,
      docRecord.title,
      originalFilenames,
      filePaths,
      new Date(docRecord.createdAt),
      docRecord.extractedText,
      docRecord.audioUrl,
      domainExplanation
    );
  }

  /**
   * Retrieves all document records sorted newest to oldest.
   */
  public async getAllDocuments(): Promise<Document[]> {
    const db = await this.readDatabase();
    const documents: Document[] = [];

    for (const key of Object.keys(db)) {
      const docRecord = db[key];
      let domainExplanation: CaterpillarsAdvice | undefined;
      
      if (docRecord.explanation) {
        domainExplanation = new CaterpillarsAdvice(
          docRecord.explanation.explanationText,
          docRecord.explanation.glossary,
          docRecord.explanation.focusSessionScript
        );
      }

      const originalFilenames = docRecord.originalFilenames || (docRecord.originalFilename ? [docRecord.originalFilename] : []);
      const filePaths = docRecord.filePaths || (docRecord.originalFilename ? [path.join(this.uploadDir, docRecord.originalFilename)] : []);

      const doc = new Document(
        docRecord.id,
        docRecord.title,
        originalFilenames,
        filePaths,
        new Date(docRecord.createdAt),
        docRecord.extractedText,
        docRecord.audioUrl,
        domainExplanation
      );

      documents.push(doc);
    }

    // Sort descending by creation timestamp
    return documents.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Deletes a document entry from database and removes actual image from physical drive.
   */
  public async deleteDocument(id: string): Promise<void> {
    if (!id || id.trim() === "") {
      return;
    }

    const db = await this.readDatabase();
    const docRecord = db[id];

    if (!docRecord) {
      return;
    }

    // Delete record from Database
    delete db[id];
    await this.writeDatabase(db);

    // Delete uploaded images from disk if possible
    try {
      const pathsToDelete = docRecord.filePaths || (docRecord.originalFilename ? [path.join(this.uploadDir, docRecord.originalFilename)] : []);
      for (const filePath of pathsToDelete) {
        if (filePath && fs.existsSync(filePath)) {
          await fsPromises.unlink(filePath);
        }
      }
    } catch {
      // Ignored: Fail gracefully if files deleted previously
    }
  }
}
