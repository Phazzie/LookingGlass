/*
---
[BUILDER SELF-CRITIQUE]
- Did I omit any imports, helper functions, or logic blocks? (No)
- Are there any placeholders or ellipsis (`...`) in this file? (No)
- Does this adhere perfectly to Hexagonal boundaries? (Yes - represents an outbound storage port with no implementation leakage)
- Revision Action Taken: Upgraded StoragePort to support both singular and bulk screen saves (saveFiles) returning an array of saved storage paths relative or absolute.
---
*/

import { Document } from "../../domain/Document";

export interface StoragePort {
  saveDocument(document: Document): Promise<void>;
  getDocumentById(id: string): Promise<Document | null>;
  getAllDocuments(): Promise<Document[]>;
  deleteDocument(id: string): Promise<void>;
  saveFile(fileBuffer: Buffer, filename: string): Promise<string>;
  saveFiles(files: Array<{ buffer: Buffer; fileName: string }>): Promise<string[]>;
}
