import fs from "fs";
import fsPromises from "fs/promises";
import path from "path";
import { StoragePort } from "../../ports/outbound/StoragePort";
import { Document } from "../../domain/Document";
import { CaterpillarsAdvice, GlossaryItem } from "../../domain/CaterpillarsAdvice";

const ALLOWED_EXTENSIONS = new Set(["png", "jpg", "jpeg", "gif", "webp"]);

interface SerializedAdvice {
  explanationText: string;
  glossary: GlossaryItem[];
  focusSessionScript?: Array<{ speaker: "Narrator" | "Alice"; text: string }>;
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
  private readonly audioDir: string;
  private writeQueue: Promise<void> = Promise.resolve();

  constructor(dbPath: string, uploadDir: string, audioDir: string) {
    if (!dbPath || dbPath.trim() === "") throw new Error("Database path cannot be empty.");
    if (!uploadDir || uploadDir.trim() === "") throw new Error("Upload directory path cannot be empty.");
    if (!audioDir || audioDir.trim() === "") throw new Error("Audio directory path cannot be empty.");

    this.dbPath = dbPath;
    this.uploadDir = uploadDir;
    this.audioDir = audioDir;

    if (!fs.existsSync(this.uploadDir)) fs.mkdirSync(this.uploadDir, { recursive: true });
    if (!fs.existsSync(this.audioDir)) fs.mkdirSync(this.audioDir, { recursive: true });

    const dbDir = path.dirname(this.dbPath);
    if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });
    if (!fs.existsSync(this.dbPath)) fs.writeFileSync(this.dbPath, "{}", { encoding: "utf-8" });
  }

  private enqueue<T>(fn: () => Promise<T>): Promise<T> {
    const next = this.writeQueue.then(fn);
    this.writeQueue = next.then(() => {}, () => {});
    return next;
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
    await fsPromises.writeFile(this.dbPath, JSON.stringify(data, null, 2), "utf-8");
  }

  public async saveFile(fileBuffer: Buffer, filename: string): Promise<string> {
    if (!fileBuffer || fileBuffer.length === 0) throw new Error("Cannot save an empty file buffer.");
    if (!filename || filename.trim() === "") throw new Error("Target file name cannot be empty.");

    const ext = (path.extname(filename).replace(".", "") || "").toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext)) throw new Error(`File type .${ext} is not permitted.`);

    const safeFilename = path.basename(filename);
    const destinationPath = path.join(this.uploadDir, safeFilename);
    await fsPromises.writeFile(destinationPath, fileBuffer);
    return destinationPath;
  }

  public async saveFiles(files: Array<{ buffer: Buffer; fileName: string }>): Promise<string[]> {
    if (!Array.isArray(files) || files.length === 0) throw new Error("Cannot save empty files payload.");
    const paths: string[] = [];
    for (const file of files) {
      paths.push(await this.saveFile(file.buffer, file.fileName));
    }
    return paths;
  }

  public saveDocument(document: Document): Promise<void> {
    if (!document) throw new Error("Document cannot be null or undefined.");
    return this.enqueue(async () => {
      const db = await this.readDatabase();
      db[document.id] = {
        id: document.id,
        userId: document.userId,
        title: document.title,
        originalFilenames: document.originalFilenames,
        filePaths: document.filePaths,
        extractedText: document.extractedText,
        audioUrl: document.audioUrl,
        createdAt: document.createdAt.toISOString(),
        explanation: document.explanation
          ? {
              explanationText: document.explanation.explanationText,
              glossary: document.explanation.glossary,
              focusSessionScript: document.explanation.focusSessionScript,
            }
          : undefined,
      };
      await this.writeDatabase(db);
    });
  }

  public async getDocumentById(id: string, userId: string): Promise<Document | null> {
    if (!id || id.trim() === "" || !/^[a-zA-Z0-9_-]+$/.test(id)) return null;
    const db = await this.readDatabase();
    if (!Object.prototype.hasOwnProperty.call(db, id)) return null;
    const rec = db[id];
    // scope to the requesting user (legacy records with no userId are owned by "default")
    const recUserId = rec.userId || "default";
    if (recUserId !== userId && userId !== "default") return null;
    return this.deserialize(rec);
  }

  public async getAllDocuments(userId: string): Promise<Document[]> {
    const db = await this.readDatabase();
    return Object.values(db)
      .filter((rec) => (rec.userId || "default") === userId)
      .map((rec) => this.deserialize(rec))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  public deleteDocument(id: string, userId: string): Promise<void> {
    if (!id || id.trim() === "" || !/^[a-zA-Z0-9_-]+$/.test(id)) return Promise.resolve();
    return this.enqueue(async () => {
      const db = await this.readDatabase();
      if (!Object.prototype.hasOwnProperty.call(db, id)) return;
      const rec = db[id];
      if ((rec.userId || "default") !== userId) return;

      delete db[id];
      await this.writeDatabase(db);

      try {
        for (const filePath of rec.filePaths ?? []) {
          if (filePath && fs.existsSync(filePath)) await fsPromises.unlink(filePath);
        }
      } catch { /* ignore */ }

      try {
        if (rec.audioUrl) {
          const audioPath = path.join(this.audioDir, path.basename(rec.audioUrl));
          if (fs.existsSync(audioPath)) await fsPromises.unlink(audioPath);
        }
      } catch { /* ignore */ }
    });
  }

  private deserialize(rec: SerializedDocument): Document {
    const explanation = rec.explanation
      ? new CaterpillarsAdvice(
          rec.explanation.explanationText,
          rec.explanation.glossary,
          rec.explanation.focusSessionScript
        )
      : undefined;

    return new Document(
      rec.id,
      rec.title,
      rec.originalFilenames ?? [],
      rec.filePaths ?? [],
      new Date(rec.createdAt),
      rec.extractedText,
      rec.audioUrl,
      explanation,
      rec.userId || "default"
    );
  }
}
