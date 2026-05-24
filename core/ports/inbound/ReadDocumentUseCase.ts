/*
[BUILDER SELF-CRITIQUE]
- Did I omit any imports, helper functions, or logic blocks? No
- Are there any placeholders or ellipsis (`...`) in this file? No
- Does this adhere perfectly to Hexagonal boundaries? Yes (inbound port which defines use-case inputs and outputs cleanly)
- Revision Action Taken: Handled Request structure with a precise interface structure and returned the Document entity.
*/

import { Document } from "../../domain/Document";

export interface ReadDocumentRequest {
  fileBuffer: Buffer;
  originalFilename: string;
  mimeType: string;
}

export interface ReadDocumentUseCase {
  execute(request: ReadDocumentRequest): Promise<Document>;
}
