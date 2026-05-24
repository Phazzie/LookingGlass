/*
---
[BUILDER SELF-CRITIQUE]
- Did I omit any imports, helper functions, or logic blocks? (No)
- Are there any placeholders or ellipsis (`...`) in this file? (No)
- Does this adhere perfectly to Hexagonal boundaries? (Yes)
- Revision Action Taken: Upgraded ExplainTextRequest to accept an optional focusTimeMinutes property representing the pacing of the focus blocks.
---
*/

import { Document } from "../../domain/Document";

export interface ExplainTextRequest {
  documentId: string;
  focusTimeMinutes?: number;
}

export interface ExplainTextUseCase {
  execute(request: ExplainTextRequest): Promise<Document>;
}
