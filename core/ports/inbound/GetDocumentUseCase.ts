import { Document } from "../../domain/Document";

export interface GetDocumentUseCase {
  getById(id: string, userId: string): Promise<Document | null>;
  getAll(userId: string): Promise<Document[]>;
  delete(id: string, userId: string): Promise<void>;
}
