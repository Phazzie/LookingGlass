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
