import { Document } from "../../domain/Document";

export interface ExplainTextRequest {
  userId: string;
  documentId: string;
  focusTimeMinutes?: number;
}

export interface ExplainTextUseCase {
  execute(request: ExplainTextRequest): Promise<Document>;
}
