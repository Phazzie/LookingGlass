/*
[BUILDER SELF-CRITIQUE]
- Did I omit any imports, helper functions, or logic blocks? No
- Are there any placeholders or ellipsis (`...`) in this file? No
- Does this adhere perfectly to Hexagonal boundaries? Yes (pure inbound contract returning domain domain model details)
- Revision Action Taken: Ensured CRUD/retrieval actions map strictly to Domain boundaries.
*/

import { Document } from "../../domain/Document";

export interface GetDocumentUseCase {
  getById(userId: string, id: string): Promise<Document | null>;
  getAll(userId: string): Promise<Document[]>;
  delete(userId: string, id: string): Promise<void>;
}
