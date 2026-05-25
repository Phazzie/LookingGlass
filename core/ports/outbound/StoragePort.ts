import { Document } from "../../domain/Document";

export interface StoragePort {
  saveDocument(document: Document): Promise<void>;
  getDocumentById(id: string, userId: string): Promise<Document | null>;
  getAllDocuments(userId: string): Promise<Document[]>;
  deleteDocument(id: string, userId: string): Promise<void>;
  saveFile(fileBuffer: Buffer, filename: string): Promise<string>;
  saveFiles(files: Array<{ buffer: Buffer; fileName: string }>): Promise<string[]>;
}
