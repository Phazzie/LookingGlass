/*
---
[BUILDER SELF-CRITIQUE]
- Did I omit any imports, helper functions, or logic blocks? (No)
- Are there any placeholders or ellipsis (`...`) in this file? (No)
- Does this adhere perfectly to Hexagonal boundaries? (Yes - local data persistence handling details)
- Revision Action Taken: Wrapped read/write ops in a writeQueue promise chain to prevent race conditions. Updated user-specific filtering logic to keep isolated data spaces.
---
*/

import fs from "fs";
import fsPromises from "fs/promises";
import path from "path";
import { StoragePort } from "../../ports/outbound/StoragePort";
import { Document } from "../../domain/Document";
import { CaterpillarsAdvice, GlossaryItem, FocusSessionLine } from "../../domain/CaterpillarsAdvice";

interface SerializedAdvice {
  explanationText: string;
  glossary: GlossaryItem[];
  focusSessionScript?: FocusSessionLine[];
}

interface SerializedDocument {
  id: string;
  userId: string;
  title: string;
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
  private writeQueue: Promise<void> = Promise.resolve();

  constructor(dbPath: string, uploadDir: string) {
    if (!dbPath || dbPath.trim() === "") {
      throw new Error("Database path cannot be empty.");
    }
    if (!uploadDir || uploadDir.trim() === "") {
      throw new Error("Upload directory path cannot be empty.");
    }

    this.dbPath = dbPath;
    this.uploadDir = uploadDir;

    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }

    const dbDir = path.dirname(this.dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    if (!fs.existsSync(this.dbPath)) {
      fs.writeFileSync(this.dbPath, "{}", { encoding: "utf-8" });
    }
  }

  private enqueueTransaction<T>(operation: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.writeQueue = this.writeQueue
        .then(() => operation())
        .then(resolve)
        .catch(reject);
    });
  }

  private async readDatabase(): Promise<DatabaseSchema> {
    try {
      const content = await fsPromises.readFile(this.dbPath, "utf-8");
      return JSON.parse(content) as DatabaseSchema;
    } catch {
      return {};
    }
  }

  private async writeDatabase(data: DatabaseSchema): Promise<void> {
    const content = JSON.stringify(data, null, 2);
    await fsPromises.writeFile(this.dbPath, content, "utf-8");
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

  public async saveDocument(userId: string, document: Document): Promise<void> {
    if (!document) {
      throw new Error("Document cannot be null or undefined.");
    }

    await this.enqueueTransaction(async () => {
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
        userId: userId,
        title: document.title,
        originalFilenames: document.originalFilenames,
        filePaths: document.filePaths,
        extractedText: document.extractedText,
        audioUrl: document.audioUrl,
        createdAt: document.createdAt.toISOString(),
        explanation: serializedExplanation
      };

      db[document.id] = serializedDoc;
      await this.writeDatabase(db);
    });
  }

  public async getDocumentById(userId: string, id: string): Promise<Document | null> {
    if (!id || id.trim() === "") {
      return null;
    }

    return await this.enqueueTransaction(async () => {
      const db = await this.readDatabase();
      const docRecord = db[id];

      if (!docRecord || docRecord.userId !== userId) {
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

      return new Document(
        docRecord.id,
        docRecord.title,
        docRecord.originalFilenames || [],
        docRecord.filePaths || [],
        new Date(docRecord.createdAt),
        docRecord.extractedText,
        docRecord.audioUrl,
        domainExplanation,
        docRecord.userId
      );
    });
  }

  public async getAllDocuments(userId: string): Promise<Document[]> {
    return await this.enqueueTransaction(async () => {
      const db = await this.readDatabase();
      const documents: Document[] = [];

      for (const key of Object.keys(db)) {
        const docRecord = db[key];
        
        if (docRecord.userId !== userId) {
          continue;
        }

        let domainExplanation: CaterpillarsAdvice | undefined;
        if (docRecord.explanation) {
          domainExplanation = new CaterpillarsAdvice(
            docRecord.explanation.explanationText,
            docRecord.explanation.glossary,
            docRecord.explanation.focusSessionScript
          );
        }

        const doc = new Document(
          docRecord.id,
          docRecord.title,
          docRecord.originalFilenames || [],
          docRecord.filePaths || [],
          new Date(docRecord.createdAt),
          docRecord.extractedText,
          docRecord.audioUrl,
          domainExplanation,
          docRecord.userId
        );

        documents.push(doc);
      }

      return documents.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    });
  }

  public async deleteDocument(userId: string, id: string): Promise<void> {
    if (!id || id.trim() === "") {
      return;
    }

    await this.enqueueTransaction(async () => {
      const db = await this.readDatabase();
      const docRecord = db[id];

      if (!docRecord || docRecord.userId !== userId) {
        return;
      }

      delete db[id];
      await this.writeDatabase(db);

      try {
        const pathsToDelete = docRecord.filePaths || [];
        for (const filePath of pathsToDelete) {
          if (filePath && fs.existsSync(filePath)) {
            await fsPromises.unlink(filePath);
          }
        }
      } catch {
        // Ignored
      }
    });
  }
}
