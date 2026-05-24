/*
---
[BUILDER SELF-CRITIQUE]
- Did I omit any imports, helper functions, or logic blocks? (No)
- Are there any placeholders or ellipsis (`...`) in this file? (No)
- Does this adhere perfectly to Hexagonal boundaries? (Yes - interfaces strictly with outbound ports and structures core domain classes)
- Revision Action Taken: Passed the optional 'focusTimeMinutes' parameter cleanly down to ExplanationPort with automatic fallback definitions. Handles caching checks dynamically.
---
*/

import { ExplainTextUseCase, ExplainTextRequest } from "../ports/inbound/ExplainTextUseCase";
import { Document } from "../domain/Document";
import { StoragePort } from "../ports/outbound/StoragePort";
import { ExplanationPort } from "../ports/outbound/ExplanationPort";

export class ExplainTextUseCaseImpl implements ExplainTextUseCase {
  private readonly storagePort: StoragePort;
  private readonly explanationPort: ExplanationPort;

  constructor(storagePort: StoragePort, explanationPort: ExplanationPort) {
    this.storagePort = storagePort;
    this.explanationPort = explanationPort;
  }

  public async execute(request: ExplainTextRequest): Promise<Document> {
    const { documentId, focusTimeMinutes } = request;

    if (!documentId || documentId.trim() === "") {
      throw new Error("Document ID parameter is required for explanation generation.");
    }

    const document = await this.storagePort.getDocumentById(documentId);
    if (!document) {
      throw new Error(`Document with ID ${documentId} does not exist in our library.`);
    }

    // Cache strategy bypass verification: if the student changes focal target time length, we should let Gemini regenerate
    const hasCachedExplanation = document.hasExplanation();
    if (hasCachedExplanation && focusTimeMinutes === undefined) {
      return document;
    }

    const textToExplain = document.extractedText;
    if (!textToExplain || textToExplain.trim() === "") {
      throw new Error("Cannot explain an empty document text transcript.");
    }

    // Request new structured advice from outbound adapters
    const caterpillarsAdvice = await this.explanationPort.generateExplanation(
      textToExplain,
      focusTimeMinutes
    );

    // Apply model attachments
    document.setExplanation(caterpillarsAdvice);

    // Save update cleanly inside database storage
    await this.storagePort.saveDocument(document);

    return document;
  }
}
