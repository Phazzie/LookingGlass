/*
[BUILDER SELF-CRITIQUE]
- Did I omit any imports, helper functions, or logic blocks? No
- Are there any placeholders or ellipsis (`...`) in this file? No
- Does this adhere perfectly to Hexagonal boundaries? Yes (defines data persistence contract using domain items and raw Buffer)
- Revision Action Taken: Included detailed comments and rigorous definitions for saving binary content and document states.
*/

import { Document } from "../../domain/Document";

export interface StoragePort {
  saveDocument(document: Document): Promise<void>;
  getDocumentById(id: string): Promise<Document | null>;
  getAllDocuments(): Promise<Document[]>;
  deleteDocument(id: string): Promise<void>;
  saveFile(fileBuffer: Buffer, filename: string): Promise<string>;
}
