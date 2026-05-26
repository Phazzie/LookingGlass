import { eq, and, desc } from "drizzle-orm";
import { db } from "../../../db";
import { documents } from "../../../db/schema";
import { StoragePort } from "../../ports/outbound/StoragePort";
import { Document } from "../../domain/Document";
import { CaterpillarsAdvice } from "../../domain/CaterpillarsAdvice";
import fs from "fs";
import fsPromises from "fs/promises";
import path from "path";

const ALLOWED_EXTENSIONS = new Set(["png", "jpg", "jpeg", "gif", "webp"]);

export class PostgresStorageAdapter implements StoragePort {
  private readonly uploadDir: string;
  private readonly audioDir: string;

  constructor(uploadDir: string, audioDir: string) {
    if (!uploadDir || uploadDir.trim() === "") throw new Error("Upload directory path cannot be empty.");
    if (!audioDir || audioDir.trim() === "") throw new Error("Audio directory path cannot be empty.");
    this.uploadDir = uploadDir;
    this.audioDir = audioDir;
    if (!fs.existsSync(this.uploadDir)) fs.mkdirSync(this.uploadDir, { recursive: true });
    if (!fs.existsSync(this.audioDir)) fs.mkdirSync(this.audioDir, { recursive: true });
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

  public async saveDocument(document: Document): Promise<void> {
    const values = {
      id: document.id,
      userId: document.userId,
      title: document.title,
      originalFilenames: document.originalFilenames,
      filePaths: document.filePaths,
      extractedText: document.extractedText ?? null,
      audioUrl: document.audioUrl ?? null,
      createdAt: document.createdAt,
      explanationText: document.explanation?.explanationText ?? null,
      glossary: document.explanation?.glossary ?? null,
      focusSessionScript: document.explanation?.focusSessionScript ?? null,
    };
    await db
      .insert(documents)
      .values(values)
      .onConflictDoUpdate({ target: documents.id, set: values });
  }

  public async getDocumentById(id: string, userId: string): Promise<Document | null> {
    if (!id || !/^[a-zA-Z0-9_-]+$/.test(id)) return null;
    const rows = await db
      .select()
      .from(documents)
      .where(and(eq(documents.id, id), eq(documents.userId, userId)))
      .limit(1);
    if (rows.length === 0) return null;
    return this.rowToDocument(rows[0]);
  }

  public async getAllDocuments(userId: string): Promise<Document[]> {
    const rows = await db
      .select()
      .from(documents)
      .where(eq(documents.userId, userId))
      .orderBy(desc(documents.createdAt));
    return rows.map((row) => this.rowToDocument(row));
  }

  public async deleteDocument(id: string, userId: string): Promise<void> {
    if (!id || !/^[a-zA-Z0-9_-]+$/.test(id)) return;
    const rows = await db
      .select()
      .from(documents)
      .where(and(eq(documents.id, id), eq(documents.userId, userId)))
      .limit(1);
    if (rows.length === 0) return;
    const rec = rows[0];

    await db.delete(documents).where(and(eq(documents.id, id), eq(documents.userId, userId)));

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
  }

  private rowToDocument(row: typeof documents.$inferSelect): Document {
    const explanation =
      row.explanationText
        ? new CaterpillarsAdvice(
            row.explanationText,
            row.glossary ?? [],
            row.focusSessionScript ?? undefined
          )
        : undefined;

    return new Document(
      row.id,
      row.title,
      row.originalFilenames,
      row.filePaths,
      row.createdAt,
      row.extractedText ?? undefined,
      row.audioUrl ?? undefined,
      explanation,
      row.userId
    );
  }
}
