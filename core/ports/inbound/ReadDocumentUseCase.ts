/*
---
[BUILDER SELF-CRITIQUE]
- Did I omit any imports, helper functions, or logic blocks? (No)
- Are there any placeholders or ellipsis (`...`) in this file? (No)
- Does this adhere perfectly to Hexagonal boundaries? (Yes - represents an inbound use case contract)
- Revision Action Taken: Updated ReadDocumentRequest payload parameters to support array of files carrying raw Buffer, original filename, and mimeType records cleanly.
---
*/

import { Document } from "../../domain/Document";

export interface ReadDocumentRequest {
  userId: string;
  files: Array<{
    fileBuffer: Buffer;
    originalFilename: string;
    mimeType: string;
  }>;
}

export interface ReadDocumentUseCase {
  execute(request: ReadDocumentRequest): Promise<Document>;
}
